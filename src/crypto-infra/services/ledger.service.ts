import mongoose from 'mongoose';
import {
  Ledger,
  LedgerType,
  LedgerCategory,
  TransactionAction,
  LedgerSide,
  SystemAccount,
} from '@/crypto-infra/models/ledger.model';
import * as Decimal from '@/utils/decimal.util';

export interface RecordEntryParams {
  userId: string;
  asset: string;
  amount: string;
  type: LedgerType;
  refId: string;
  category: LedgerCategory;
  action: TransactionAction;
  counterparty?: string;
  image?: string;
  status?: string;
  tradedAsset?: string;
  affectsBalance?: boolean;
  images?: string[];
  description?: string;
  session?: mongoose.ClientSession;
}

export class LedgerService {
  /**
   * Double-Entry Credit: Creates a CREDIT for the user and a DEBIT for the counterparty.
   * Idempotent via referenceId + side compound unique index.
   * If an external session is provided, operations join that session (no internal commit).
   * If no session is provided, creates and manages its own session.
   */
  static async recordEntry(params: RecordEntryParams) {
    const {
      userId,
      asset,
      amount,
      type,
      refId,
      category,
      action,
      counterparty = SystemAccount.HOT_WALLET,
      image,
      status = 'completed',
      tradedAsset,
      affectsBalance = true,
      images,
      description,
      session: externalSession,
    } = params;

    const absoluteAmount = Decimal.abs(amount);
    const account = `USER:${userId}`;
    const correlationId = refId;
    const desc = description || `Credit ${absoluteAmount} ${asset} via ${type}`;

    // If an external session is passed, we join it (caller manages commit/abort).
    if (externalSession) {
      return this._createDoubleEntry({
        userId, asset, absoluteAmount, account, counterparty,
        correlationId, type, category, action, refId, desc,
        image, images, status, tradedAsset, affectsBalance,
        session: externalSession,
      });
    }

    // Otherwise, create our own session.
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await this._createDoubleEntry({
        userId, asset, absoluteAmount, account, counterparty,
        correlationId, type, category, action, refId, desc,
        image, images, status, tradedAsset, affectsBalance,
        session,
      });

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Double-Entry Debit: Creates a DEBIT for the user and a CREDIT for the counterparty.
   * Verifies the user has sufficient balance within the session (document-level lock).
   */
  static async recordDebit(params: RecordEntryParams) {
    const {
      userId,
      asset,
      amount,
      type,
      refId,
      category,
      action,
      counterparty = SystemAccount.HOT_WALLET,
      image,
      status = 'completed',
      tradedAsset,
      affectsBalance = true,
      images,
      description,
      session: externalSession,
    } = params;

    const absoluteAmount = Decimal.abs(amount);
    const account = `USER:${userId}`;
    const correlationId = refId;
    const desc = description || `Debit ${absoluteAmount} ${asset} via ${type}`;

    if (externalSession) {
      // Balance check within session
      if (affectsBalance) {
        const balance = await this.getBalance(userId, asset, externalSession);
        if (!Decimal.gte(balance, absoluteAmount)) {
          throw new Error(`Insufficient balance. Have ${balance}, need ${absoluteAmount} ${asset}`);
        }
      }

      return this._createDoubleEntry({
        userId, asset, absoluteAmount, account, counterparty,
        correlationId, type, category, action, refId, desc,
        image, images, status, tradedAsset, affectsBalance,
        session: externalSession,
        invertSides: true,
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (affectsBalance) {
        const balance = await this.getBalance(userId, asset, session);
        if (!Decimal.gte(balance, absoluteAmount)) {
          throw new Error(`Insufficient balance. Have ${balance}, need ${absoluteAmount} ${asset}`);
        }
      }

      const result = await this._createDoubleEntry({
        userId, asset, absoluteAmount, account, counterparty,
        correlationId, type, category, action, refId, desc,
        image, images, status, tradedAsset, affectsBalance,
        session,
        invertSides: true,
      });

      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Internal: creates the paired ledger entries.
   * invertSides=false: CREDIT for user, DEBIT for counterparty (deposit/receive)
   * invertSides=true:  DEBIT for user, CREDIT for counterparty (withdrawal/send)
   */
  private static async _createDoubleEntry(opts: {
    userId: string;
    asset: string;
    absoluteAmount: string;
    account: string;
    counterparty: string;
    correlationId: string;
    type: LedgerType;
    category: LedgerCategory;
    action: TransactionAction;
    refId: string;
    desc: string;
    image?: string;
    images?: string[];
    status: string;
    tradedAsset?: string;
    affectsBalance: boolean;
    session: mongoose.ClientSession;
    invertSides?: boolean;
  }) {
    const {
      userId, asset, absoluteAmount, account, counterparty,
      correlationId, type, category, action, refId, desc,
      image, images, status, tradedAsset, affectsBalance,
      session, invertSides = false,
    } = opts;

    const userSide = invertSides ? LedgerSide.DEBIT : LedgerSide.CREDIT;
    const counterpartySide = invertSides ? LedgerSide.CREDIT : LedgerSide.DEBIT;

    // 1. Idempotency check
    const existing = await Ledger.findOne({ referenceId: refId, side: userSide }).session(session);
    if (existing) {
      console.warn(`Duplicate transaction attempt: ${refId}`);
      return existing;
    }

    // 2. Create user-side entry
    const [userEntry] = await Ledger.create(
      [{
        userId,
        asset,
        amount: absoluteAmount,
        side: userSide,
        account,
        counterpartyAccount: counterparty,
        correlationId,
        type,
        transactionCategory: category,
        transactionType: action,
        referenceId: refId,
        description: desc,
        image,
        images: images || [],
        status,
        tradedAsset: tradedAsset || asset,
        affectsBalance,
      }],
      { session },
    );

    // 3. Create counterparty entry
    await Ledger.create(
      [{
        userId,
        asset,
        amount: absoluteAmount,
        side: counterpartySide,
        account: counterparty,
        counterpartyAccount: account,
        correlationId,
        type,
        transactionCategory: category,
        transactionType: action,
        referenceId: refId,
        description: `Counter: ${desc}`,
        image,
        images: images || [],
        status,
        tradedAsset: tradedAsset || asset,
        affectsBalance: false, // System side doesn't affect user balance queries
      }],
      { session },
    );

    return userEntry;
  }

  /**
   * Get the balance for a specific user+asset pair.
   * Balance = SUM(CREDIT amounts) - SUM(DEBIT amounts) for the user's account.
   */
  static async getBalance(
    userId: string,
    asset: string,
    session?: mongoose.ClientSession,
  ): Promise<string> {
    const account = `USER:${userId}`;

    const entries = await Ledger.find({
      account,
      asset,
      affectsBalance: true,
    }).session(session || null).lean();

    let credits = '0';
    let debits = '0';

    for (const entry of entries) {
      if (entry.side === LedgerSide.CREDIT) {
        credits = Decimal.add(credits, entry.amount);
      } else {
        debits = Decimal.add(debits, entry.amount);
      }
    }

    return Decimal.sub(credits, debits);
  }

  /**
   * Get all balances for a user (multi-asset).
   * Returns array of { asset, balance }.
   */
  static async getBalances(userId: string): Promise<{ asset: string; balance: string }[]> {
    const account = `USER:${userId}`;

    const entries = await Ledger.find({
      account,
      affectsBalance: true,
    }).lean();

    const assetMap = new Map<string, { credits: string; debits: string }>();

    for (const entry of entries) {
      if (!assetMap.has(entry.asset)) {
        assetMap.set(entry.asset, { credits: '0', debits: '0' });
      }
      const bucket = assetMap.get(entry.asset)!;
      if (entry.side === LedgerSide.CREDIT) {
        bucket.credits = Decimal.add(bucket.credits, entry.amount);
      } else {
        bucket.debits = Decimal.add(bucket.debits, entry.amount);
      }
    }

    const result: { asset: string; balance: string }[] = [];
    for (const [asset, { credits, debits }] of assetMap) {
      const balance = Decimal.sub(credits, debits);
      if (!Decimal.isZero(balance)) {
        result.push({ asset, balance });
      }
    }

    return result;
  }

  /**
   * Get total system liability for an asset (sum of all user balances).
   */
  static async getSystemLiability(asset: string): Promise<string> {
    const entries = await Ledger.find({
      asset,
      affectsBalance: true,
      account: { $regex: /^USER:/ },
    }).lean();

    let credits = '0';
    let debits = '0';

    for (const entry of entries) {
      if (entry.side === LedgerSide.CREDIT) {
        credits = Decimal.add(credits, entry.amount);
      } else {
        debits = Decimal.add(debits, entry.amount);
      }
    }

    return Decimal.sub(credits, debits);
  }

  /**
   * Update the status of a ledger entry (both sides of the double-entry).
   */
  static async updateLedgerStatus(refId: string, status: string) {
    await Ledger.updateMany(
      { referenceId: refId },
      { status },
    );
    return await Ledger.findOne({ referenceId: refId, account: { $regex: /^USER:/ } });
  }
}
