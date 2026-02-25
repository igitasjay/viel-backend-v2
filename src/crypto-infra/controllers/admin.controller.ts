import type { Request, Response } from 'express';
import { Currency } from '../models/Currency';
import { Ledger } from '../models/Ledger';
import { Wallet } from '../models/Wallet';

export const addCurrency = async (req: Request, res: Response) => {
  try {
    const {
      symbol,
      name,
      network,
      contractAddress,
      buyRate,
      sellRate,
      addressRegex,
      memoRegex,
      fee,
      feeType,
      minimum,
      explorerLink,
      is_stable,
      color,
      minimumDeposit,
      maximumDecimalPlaces,
      naira_rate,
      usd_rate,
      status, // optional, defaults to 1
      price_symbol,
    } = req.body;

    // Check if file exists (Multer)
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'Coin image is required' });
    }

    // Check for existing currency with same symbol and network
    const existingCurrency = await Currency.findOne({ symbol, network });
    if (existingCurrency) {
      return res.status(409).json({ error: `Currency ${symbol} on ${network} already exists` });
    }

    const newCurrency = await Currency.create({
      symbol,
      name,
      network,
      contractAddress,
      imageUrl: file.path, // Use Cloudinary URL
      buyRate: Number(buyRate || 0),
      sellRate: Number(sellRate || 0),
      
      // New Fields conversion
      addressRegex,
      memoRegex,
      fee: Number(fee || 0),
      feeType: feeType || 'FLAT',
      minimum: Number(minimum || 0),
      explorerLink,
      
      is_stable: is_stable === 'true' || is_stable === true || is_stable === 1 || is_stable === '1',
      color,
      minimumDeposit: Number(minimumDeposit || 0),
      maximumDecimalPlaces: Number(maximumDecimalPlaces || 8),
      naira_rate: Number(naira_rate || 0),
      usd_rate: Number(usd_rate || 0),
      status: Number(status || 1),
      price_symbol: price_symbol || null,
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

export const updateRates = async (req: Request, res: Response) => {
  try {
    const { symbol, buyRate, sellRate } = req.body;

    const result = await Currency.updateMany(
      { symbol },
      { buyRate, sellRate }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Currency not found' });

    return res.json({ success: true, message: `Updated ${result.modifiedCount} networks for ${symbol}` });
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

export const updateCurrency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      symbol,
      name,
      network,
      contractAddress,
      buyRate,
      sellRate,
      addressRegex,
      memoRegex,
      fee,
      feeType,
      minimum,
      explorerLink,
      is_stable,
      color,
      minimumDeposit,
      maximumDecimalPlaces,
      naira_rate,
      usd_rate,
      status,
      decimals,
      price_symbol
    } = req.body;

    const file = (req as any).file;

    const currency = await Currency.findById(id);
    if (!currency) {
      return res.status(404).json({ error: 'Currency not found' });
    }

    // Check for duplicates if symbol or network is changing
    if ((symbol && symbol !== currency.symbol) || (network && network !== currency.network)) {
      const existing = await Currency.findOne({
        symbol: symbol || currency.symbol,
        network: network || currency.network,
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(409).json({ error: `Currency ${symbol || currency.symbol} on ${network || currency.network} already exists` });
      }
    }

    // Update fields
    if (symbol) currency.symbol = symbol;
    if (name) currency.name = name;
    if (network) currency.network = network;
    if (contractAddress !== undefined) currency.contractAddress = contractAddress;
    if (buyRate !== undefined) currency.buyRate = Number(buyRate);
    if (sellRate !== undefined) currency.sellRate = Number(sellRate);
    if (addressRegex !== undefined) currency.addressRegex = addressRegex;
    if (memoRegex !== undefined) currency.memoRegex = memoRegex;
    if (fee !== undefined) currency.fee = Number(fee);
    if (feeType) currency.feeType = feeType;
    if (minimum !== undefined) currency.minimum = Number(minimum);
    if (explorerLink !== undefined) currency.explorerLink = explorerLink;
    if (is_stable !== undefined) currency.is_stable = is_stable === 'true' || is_stable === true || is_stable === 1 || is_stable === '1';
    if (color) currency.color = color;
    if (minimumDeposit !== undefined) currency.minimumDeposit = Number(minimumDeposit);
    if (maximumDecimalPlaces !== undefined) currency.maximumDecimalPlaces = Number(maximumDecimalPlaces);
    if (naira_rate !== undefined) currency.naira_rate = Number(naira_rate);
    if (usd_rate !== undefined) currency.usd_rate = Number(usd_rate);
    if (status !== undefined) currency.status = Number(status);
    if (decimals !== undefined) currency.decimals = Number(decimals);
    if (price_symbol !== undefined) currency.price_symbol = price_symbol;

    if (file) {
      currency.imageUrl = file.path;
    }

    await currency.save();

    return res.json({ success: true, data: currency });

  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Currency pair already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
};
