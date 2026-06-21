import axios from 'axios';
// import config from '@/config/config';
import { config } from 'dotenv'
config()

// The environment variable config should be defined in config.ts, but for immediate v2 use:
const RELOADLY_API_URL = process.env.RELOADLY_API_URL || 'https://giftcards-sandbox.reloadly.com';
const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET;
const RELOADLY_AUDIENCE = process.env.RELOADLY_AUDIENCE || 'https://giftcards-sandbox.reloadly.com';

let accessTokenCache: { token: string; expiresAt: number } | null = null;

export const getReloadlyAccessToken = async (): Promise<string> => {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60000) {
    return accessTokenCache.token;
  }

  if (!RELOADLY_CLIENT_ID || !RELOADLY_CLIENT_SECRET) {
    throw new Error('RELOADLY_CLIENT_ID or RELOADLY_CLIENT_SECRET not set in environment');
  }

  try {
    const response = await axios.post('https://auth.reloadly.com/oauth/token', {
      client_id: RELOADLY_CLIENT_ID,
      client_secret: RELOADLY_CLIENT_SECRET,
      grant_type: 'client_credentials',
      audience: RELOADLY_AUDIENCE,
    });

    const expiresIn = response.data.expires_in || 86400;
    accessTokenCache = {
      token: response.data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    return response.data.access_token;
  } catch (error: any) {
    console.error('Reloadly Auth Error:', error.response?.data || error.message);
    throw new Error('Failed to get Reloadly access token');
  }
};

export const getReloadlyProducts = async (page: number = 1, size: number = 200) => {
  const token = await getReloadlyAccessToken();
  try {
    const response = await axios.get(`${RELOADLY_API_URL}/products?page=${page}&size=${size}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/com.reloadly.giftcards-v1+json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Reloadly get products error:', error.message);
    throw error;
  }
};

export const getReloadlyProductFxRate = async (productId: number) => {
  const token = await getReloadlyAccessToken();
  try {
    const response = await axios.get(`${RELOADLY_API_URL}/products/${productId}`, {
      headers: {
        Accept: 'application/com.reloadly.giftcards-v1+json',
      },
    });
    // This endpoint usually returns senderFee, discount, and sometimes fx rate info depending on the product
    // Wait, the standard endpoint to get fx rate might vary, but we can assume product details endpoint
    // gives the latest information. We return the whole product for simplicity.
    return response.data;
  } catch (error: any) {
    console.error('Reloadly get product details error:', error.message);
    throw error;
  }
};

export const placeReloadlyOrder = async (payload: {
  productId: number;
  quantity: number;
  unitPrice: number;
  senderName: string;
  recipientEmail: string;
  customIdentifier: string;
}) => {
  const token = await getReloadlyAccessToken();
  try {
    const response = await axios.post(
      `${RELOADLY_API_URL}/orders`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/com.reloadly.giftcards-v1+json',
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Reloadly place order error:', error.response?.data || error.message);
    throw error;
  }
};

export const getReloadlyOrderCodes = async (transactionId: number) => {
  const token = await getReloadlyAccessToken();
  try {
    const response = await axios.get(
      `${RELOADLY_API_URL}/orders/transactions/${transactionId}/cards`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/com.reloadly.giftcards-v1+json',
        },
      }
    );
    return response.data; // Should return an array of cards/pins
  } catch (error: any) {
    console.error('Reloadly get codes error:', error.response?.data || error.message);
    throw error;
  }
};
