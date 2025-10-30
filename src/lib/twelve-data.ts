// src/lib/twelve-data.ts
import axios from 'axios';
import config from '@/config';
import { logger } from '@/lib/winston';

const API_KEY = config.TWELVE_DATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

export const fetchLiveRate = async (
  symbol: string,
): Promise<{ ngn: number } | null> => {
  if (!API_KEY) {
    logger.warn('Twelve Data API key not configured.');
    return null;
  }

  try {
    const response = await axios.get(`${BASE_URL}/exchange_rate`, {
      params: {
        symbol: `${symbol}/NGN`,
        apikey: API_KEY,
      },
      timeout: 8000,
    });

    if (response.data && response.data.rate) {
      return { ngn: parseFloat(response.data.rate) };
    }
    return null;
  } catch (error: any) {
    logger.error(`Twelve Data rate fetch failed for ${symbol}:`, error.message);
    return null;
  }
};
