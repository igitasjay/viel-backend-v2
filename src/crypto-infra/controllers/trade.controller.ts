import type { Request, Response } from 'express';
import { Currency } from '../models/Currency';
import { LedgerService } from '../services/ledger.service';
import { LedgerType } from '../models/Ledger';
import axios from 'axios';

// Mock Oracle Price
const getMarketPrice = async (symbol: string) => {
  // Call Twelve Data / CoinGecko here
  return 1500; // e.g. 1 USDT = 1500 NGN
};

/**
 * GET /rates
 */
export const getRates = async (req: Request, res: Response) => {
  try {
    const currencies = await Currency.find({ isActive: true });
    const rates = [];

    for (const coin of currencies) {
      const marketPrice = await getMarketPrice(coin.symbol);
      rates.push({
        pair: `${coin.symbol}/NGN`,
        buy: marketPrice * (1 + coin.buySpread / 100),
        sell: marketPrice * (1 - coin.sellSpread / 100),
      });
    }

    return res.json({ success: true, data: rates });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /trade/buy (Fiat -> Crypto)
 */
export const buyCrypto = async (req: Request, res: Response) => {
  try {
    const { amountNGN, symbol } = req.body; // Spend 150,000 NGN to buy USDT
    const userId = req.userId?.toString();

    // 1. Get Rate
    const coin = await Currency.findOne({ symbol });
    if (!coin) throw new Error('Invalid Coin');

    const marketPrice = await getMarketPrice(symbol);
    const buyRate = marketPrice * (1 + coin.buySpread / 100);

    const cryptoAmount = amountNGN / buyRate; // e.g. 100 USDT

    // 2. Execute Swap (Atomic Transaction needed ideally, simplified here)
    const ref = `TRADE-${Date.now()}`;

    // Debit NGN
    await LedgerService.creditUser(
      userId!,
      'NGN',
      -amountNGN,
      LedgerType.TRADE_BUY,
      `${ref}-DR`,
    );
    // Credit Crypto
    await LedgerService.creditUser(
      userId!,
      symbol,
      cryptoAmount,
      LedgerType.TRADE_BUY,
      `${ref}-CR`,
    );

    return res.json({ success: true, received: cryptoAmount, asset: symbol });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
