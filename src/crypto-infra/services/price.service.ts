import axios from 'axios';
import { logger } from '../../lib/winston';

const SYMBOL_TO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  USDC: 'usd-coin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  SOL: 'solana',
  TRX: 'tron',
  LTC: 'litecoin',
  // Add more as needed
};

export class PriceService {
  /**
   * Fetches live rates for a list of symbols
   * Returns a map of Symbol -> Price (USD)
   */
  static async getLiveRates(symbols: string[]): Promise<Map<string, number>> {
    try {
      // 1. Map symbols to CoinGecko IDs
      const ids: string[] = [];
      const idToSymbolMap: Record<string, string> = {};

      symbols.forEach((sym) => {
        const id = SYMBOL_TO_ID[sym.toUpperCase()];
        if (id) {
          ids.push(id);
          idToSymbolMap[id] = sym; // Keep track to map back later
        }
      });

      if (ids.length === 0) return new Map();

      // 2. Call CoinGecko API
      // Using public API (Rate limited: ~10-30 calls/min)
      const url = `https://api.coingecko.com/api/v3/simple/price`;
      const response = await axios.get(url, {
        params: {
          ids: ids.join(','),
          vs_currencies: 'usd',
        },
        timeout: 5000,
      });

      // 3. Process Response
      const rates = new Map<string, number>();
      
      // Response format: { "bitcoin": { "usd": 50000 }, ... }
      for (const [id, data] of Object.entries(response.data)) {
        const price = (data as any).usd;
        const symbol = idToSymbolMap[id];
        if (symbol && price) {
          rates.set(symbol, price);
        }
      }

      return rates;
    } catch (error) {
        // Fallback to empty map or log error
        // Don't crash the entire request if price fetch fails
        console.error('Failed to fetch live rates:', error);
        return new Map();
    }
  }
}
