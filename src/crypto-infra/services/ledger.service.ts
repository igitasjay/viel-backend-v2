import mongoose from 'mongoose';
import {
  Ledger,
  LedgerType,
  LedgerCategory,
  TransactionAction,
} from '@/crypto-infra/models/ledger.model';

export class LedgerService {
  // Atomic Credit: Ensures balance is updated exactly once.
  static async creditUser(
    userId: string,
    asset: string,
    amount: number,
    type: LedgerType,
    refId: string,
    category: LedgerCategory,
    action: TransactionAction,
    image?: string,
    status: string = 'completed',
    tradedAsset?: string,
    affectsBalance: boolean = true,
    images?: string[],
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Check Idempotency (Has this refId been processed?)
      const existing = await Ledger.findOne({ referenceId: refId }).session(
        session,
      );
      if (existing) {
        console.warn(`Duplicate transaction attempt: ${refId}`);
        await session.abortTransaction();
        return existing;
      }

      // 2. Create Ledger Entry
      const entry = await Ledger.create(
        [
          {
            userId,
            asset,
            amount, // Positive
            type,
            transactionCategory: category,
            transactionType: action,
            referenceId: refId,
            description: `Credit ${amount} ${asset} via ${type}`,
            image,
            images: images || [],
            status,
            tradedAsset: tradedAsset || asset,
            affectsBalance,
          },
        ],
        { session },
      );

      // 3. Commit
      await session.commitTransaction();
      return entry[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Update the status of a ledger entry
  static async updateLedgerStatus(refId: string, status: string) {
    return await Ledger.findOneAndUpdate(
      { referenceId: refId },
      { status },
      { new: true }
    );
  }
}
