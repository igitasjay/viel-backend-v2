import type { Request, Response } from 'express';
import { Ledger } from '../models/Ledger';
import { Wallet } from '../models/Wallet';
import { WalletService } from '../services/wallet.service';
import { LedgerService } from '../services/ledger.service';
import { LedgerType } from '../models/Ledger';
import { ethers } from 'ethers';

/**
 * GET /wallets
 * Get current user balances by summing up the Ledger
 */
export const getBalances = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const balances = await Ledger.aggregate([
      { $match: { userId: new Object(userId) } }, // Ensure ObjectId
      { $group: { _id: '$asset', balance: { $sum: '$amount' } } },
    ]);

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
 */
export const withdrawCrypto = async (req: Request, res: Response) => {
  try {
    const { amount, asset, destinationAddress } = req.body;
    const userId = req.userId?.toString();

    // 1. Verify Balance (Simple check, LedgerService handles the lock)
    // ... logic to check balance > amount ...

    // 2. Debit User Internal Ledger
    const withdrawalRef = `WD-${Date.now()}`;
    await LedgerService.creditUser(
      userId!,
      asset,
      -Math.abs(amount), // Negative for debit
      LedgerType.WITHDRAWAL,
      withdrawalRef,
    );

    // 3. Trigger Async Withdrawal Job
    // In production: Push to BullMQ. Worker picks up and signs tx with Hot Wallet.
    console.log(`Create Job: Send ${amount} ${asset} to ${destinationAddress}`);

    return res.json({
      success: true,
      message: 'Withdrawal processing',
      ref: withdrawalRef,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
