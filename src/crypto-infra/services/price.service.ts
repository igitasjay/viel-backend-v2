import axios from 'axios';
import { logger } from '../../lib/winston';
import config from '../../config/config';

export interface PriceRequest {
  symbol: string;       // app symbol (e.g. BTC)
  priceSymbol: string;  // TwelveData symbol (e.g. BTC/USD)
}

export class PriceService {
  /**
   * Fetches live rates for a list of symbols using TwelveData
   * Returns a map of Symbol -> Price (USD)
   */
  static async getLiveRates(requests: PriceRequest[]): Promise<Map<string, number>> {
    try {
      if (requests.length === 0) return new Map();

      const priceSymbolToAppSymbol: Record<string, string> = {};
      const symbolsToFetch: string[] = [];

      requests.forEach((req) => {
        if (req.priceSymbol && !req.symbol.startsWith('TEST_')) {
          symbolsToFetch.push(req.priceSymbol);
          priceSymbolToAppSymbol[req.priceSymbol] = req.symbol;
        }
      });

      if (symbolsToFetch.length === 0) return new Map();

      const apiKey = config.TWELVE_DATA_API_KEY;
      if (!apiKey) {
        logger.error('TWELVE_DATA_API_KEY is missing in config');
        return new Map();
      }

      const url = `https://api.twelvedata.com/price`;
      const response = await axios.get(url, {
        params: {
          symbol: symbolsToFetch.join(','),
          apikey: apiKey,
        },
        timeout: 10000,
      });

      const rates = new Map<string, number>();

      // TwelveData Response Format for multiple symbols:
      // { "BTC/USD": { "price": "50000.00" }, "ETH/USD": { "price": "2500.00" } }
      // OR for single symbol: { "price": "50000.00" }
      
      const data = response.data;

      if (symbolsToFetch.length === 1) {
        const priceSymbol = symbolsToFetch[0];
        const price = parseFloat(data.price);
        const appSymbol = priceSymbolToAppSymbol[priceSymbol];
        if (appSymbol && !isNaN(price)) {
          rates.set(appSymbol, price);
        }
      } else {
        for (const [priceSymbol, details] of Object.entries(data)) {
          const price = parseFloat((details as any).price);
          const appSymbol = priceSymbolToAppSymbol[priceSymbol];
          if (appSymbol && !isNaN(price)) {
            rates.set(appSymbol, price);
          }
        }
      }

      return rates;
    } catch (error) {
        logger.error('Failed to fetch live rates from TwelveData:', error);
        return new Map();
    }
  }
}
