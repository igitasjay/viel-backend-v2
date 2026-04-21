import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Ledger, LedgerCategory, TransactionAction } from '../models/ledger.model';
import { Wallet } from '../models/wallet.model';
import { Currency } from '../models/currency.model';
import { WalletService } from '../services/wallet.service';
import { LedgerService } from '../services/ledger.service';
import { LedgerType, SystemAccount } from '../models/ledger.model';
import { ethers } from 'ethers';
import { logger } from '@/lib/winston';
import * as Decimal from '@/utils/decimal.util';

/**
 * GET /wallets
 * Get current user balances via double-entry ledger
 */
export const getBalances = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const balances = await LedgerService.getBalances(userId!.toString());
    return res.json({ success: true, data: balances });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /wallets/addresses
 * Get all generated addresses for the user
 */
export const getUserWallets = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const wallets = await Wallet.find({ userId }).select('currency network address');
    return res.json({ success: true, data: wallets });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};




/**
 * POST /wallets/generate
 */
export const generateAddress = async (req: Request, res: Response) => {
  try {
    const { currency, network } = req.body;
    const userId = req.userId?.toString();

    const wallet = await WalletService.generateWallet(
      userId!,
      currency,
      network,
    );

    return res.status(201).json({
      success: true,
      data: { address: wallet.address, network: wallet.network },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /withdraw/crypto
 * Uses recordDebit with balance verification inside a session.
 */
export const withdrawCrypto = async (req: Request, res: Response) => {
  try {
    const { amount, asset, destinationAddress } = req.body;
    const userId = req.userId?.toString();

    const withdrawalRef = `WD-${Date.now()}`;
    const coin = await Currency.findOne({ symbol: asset });
    const amountStr = Decimal.abs(String(amount));

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Debit user with balance verification (inside session for document lock)
      await LedgerService.recordDebit({
        userId: userId!,
        asset,
        amount: amountStr,
        type: LedgerType.WITHDRAWAL,
        refId: withdrawalRef,
        category: LedgerCategory.CRYPTO,
        action: TransactionAction.SELL,
        counterparty: SystemAccount.HOT_WALLET,
        image: coin?.imageUrl,
        status: 'completed',
        tradedAsset: asset,
        session,
      });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // Trigger async withdrawal job (outside session — idempotent retry safe via refId)
    if (asset === 'TEST_SELL_CRYPTO') {
      logger.info(`Test Asset Simulation: Bypassed withdrawal queue for ${withdrawalRef}`);
    } else {
      console.log(`Create Job: Send ${amountStr} ${asset} to ${destinationAddress}`);
    }

    return res.json({
      success: true,
      message: 'Withdrawal processing',
      ref: withdrawalRef,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
