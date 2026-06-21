import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

interface ObiexTradeQuoteParams {
  sourceId: string;
  targetId: string;
  amount: number;
  side: 'SELL' | 'BUY';
}

interface ObiexBrokerAddressParams {
  uniqueUserIdentifier: string;
  currency: string;
  network: string;
}

interface ObiexWithdrawalParams {
  currency: string;
  network: string;
  amount: number;
  address: string;
}

export class ObiexService {
  private static get client(): AxiosInstance {
    const baseURL = process.env.OBIEX_URL || 'https://api.obiex.finance/v1';
    return axios.create({ baseURL });
  }

  private static sign(method: string, path: string, timestamp: number): string {
    const secretKey = process.env.OBIEX_SECRET_KEY || '';
    const content = `${method}/v1${path}${timestamp}`;
    return crypto.createHmac('sha256', secretKey).update(content).digest('hex');
  }

  private static async request<T>(method: 'GET' | 'POST', path: string, data?: any): Promise<T> {
    const timestamp = Date.now();
    const signature = this.sign(method, path, timestamp);
    const publicKey = process.env.OBIEX_PUBLIC_KEY || '';

    const response = await this.client.request<T>({
      method,
      url: path,
      data,
      headers: {
        'X-API-KEY': publicKey,
        'X-API-TIMESTAMP': timestamp.toString(),
        'X-API-SIGNATURE': signature,
      },
    });

    return response.data;
  }

  static async getTradeQuote(params: ObiexTradeQuoteParams) {
    // Expected response contains { data: { amountReceived: number, rate: number, quoteId: string, ... } }
    return this.request<any>('POST', '/trades/quote', params);
  }

  static async createBrokerAddress(params: ObiexBrokerAddressParams) {
    // Expected response contains { data: { value: string } } which is the address
    return this.request<any>('POST', '/addresses/broker', params);
  }

  static async createWithdrawal(params: ObiexWithdrawalParams) {
    return this.request<any>('POST', '/withdrawals', params);
  }
}
