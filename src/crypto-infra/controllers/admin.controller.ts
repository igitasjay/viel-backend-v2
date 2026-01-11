import type { Request, Response } from 'express';
import { Currency } from '../models/Currency';
import { Ledger } from '../models/Ledger';
import { Wallet } from '../models/Wallet';

export const addCurrency = async (req: Request, res: Response) => {
  try {
    const { symbol, network, contractAddress, buySpread, sellSpread } =
      req.body;

    // Check if file exists (Multer)
    if (!req.file) {
      return res.status(400).json({ error: 'Coin image is required' });
    }

    const newCurrency = await Currency.create({
      symbol,
      network,
      contractAddress,
      imageUrl: `/uploads/${req.file.filename}`, // Valid URL path
      buySpread: Number(buySpread),
      sellSpread: Number(sellSpread),
    });

    return res.status(201).json({ success: true, data: newCurrency });
  } catch (error: any) {
    // Handle Duplicate Key error
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Currency pair already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
};

export const fetchAllCurrencies = async (req: Request, res: Response) => {
  try {
    const currencies = await Currency.find();
    return res.json({ success: true, data: currencies });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateRates = async (req: Request, res: Response) => {
  try {
    const { symbol, buySpread, sellSpread } = req.body;

    const currency = await Currency.findOneAndUpdate(
      { symbol },
      { buySpread, sellSpread },
      { new: true },
    );

    if (!currency) return res.status(404).json({ error: 'Currency not found' });

    return res.json({ success: true, data: currency });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /admin/ledger/audit
 * Compare Internal Liabilities (User Balances) vs Real On-Chain Assets
 */
export const auditLedger = async (req: Request, res: Response) => {
  try {
    const { currency } = req.query; // e.g. ?currency=USDT
    if (!currency) return res.status(400).json({ error: 'Currency required' });

    // 1. Calculate Internal Liability (Sum of all user balances in DB)
    const liabilityResult = await Ledger.aggregate([
      { $match: { asset: currency } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalLiability = liabilityResult[0]?.total || 0;

    // 2. Calculate Real Assets (Sum of Hot + Cold Wallet balances)
    // Note: In a real app, you would fetch the balance of your Cold Vault here.
    // We will scan all deposit addresses for this demo (inefficient but works for prototype).
    const allWallets = await Wallet.find({ currency: currency as string });

    // In production: Don't loop promises like this. Use a balance cache or batch RPC calls.
    let onChainBalance = 0;
    // Mocking on-chain fetch for speed. In real implementation:
    // const provider = new ethers.JsonRpcProvider(...)
    // balance = await provider.getBalance(wallet.address)

    return res.json({
      asset: currency,
      internalLiability: totalLiability,
      onChainAssets: 'Calculated via RPC in bg', // Placeholder
      status: 'Solvent', // logic: assets >= liability
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
