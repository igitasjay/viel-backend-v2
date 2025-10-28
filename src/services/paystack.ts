// src/services/paystack.ts
import axios from 'axios';
import config from '@/config';
import { logger } from '@/lib/winston';

// Paystack API base URL
const PAYSTACK_API_URL = 'https://api.paystack.co';

// Types for Paystack Transfer API
interface TransferRequest {
  source: 'balance';
  amount: number; // Amount in kobo (NGN) or cents (GHS/ZAR)
  recipient: string; // Recipient code from /transferrecipient
  reference: string; // Unique transaction reference
  currency?: 'NGN'; // Optional, defaults to NGN
}

interface TransferResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    amount: number;
    currency: string;
    status: string;
    reference: string;
    recipient: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Initiates a bank transfer using Paystack Transfers API.
 * @param secretKey Paystack secret key
 * @param transferData Transfer details (source, amount, recipient, reference, currency)
 * @returns Paystack API response
 */
export async function initiatePaystackTransfer(
  secretKey: string,
  transferData: TransferRequest,
): Promise<TransferResponse> {
  const response = await axios.post<TransferResponse>(
    `${PAYSTACK_API_URL}/transfer`,
    transferData,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data;
}

// ADD THIS BELOW initiatePaystackTransfer

interface CreateRecipientRequest {
  type: 'nuban' | 'mobile_money';
  name: string;
  account_number: string;
  bank_code: string;
  currency: 'NGN' | 'GHS' | 'ZAR';
}

interface CreateRecipientResponse {
  status: boolean;
  data: { recipient_code: string };
}

export async function createPaystackRecipient(
  secretKey: string,
  data: CreateRecipientRequest,
): Promise<string> {
  const response = await axios.post<CreateRecipientResponse>(
    `${PAYSTACK_API_URL}/transferrecipient`,
    data,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data.data.recipient_code;
}

// src/services/paystack.ts (add after createPaystackRecipient)

interface Bank {
  id: number;
  name: string;
  code: string;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BankListResponse {
  status: boolean;
  message: string;
  data: Bank[];
}

/**
 * Fetches list of banks from Paystack (NGN: Nigeria, GHS: Ghana, ZAR: South Africa).
 * @param secretKey Paystack secret key
 * @param country Optional: 'nigeria' | 'ghana' | 'south_africa'
 * @returns Array of { code, name }
 */
export async function getPaystackBanks(
  secretKey: string,
  country: 'nigeria' | 'ghana' | 'south_africa' = 'nigeria',
): Promise<{ code: string; name: string }[]> {
  const response = await axios.get<BankListResponse>(
    `${PAYSTACK_API_URL}/bank`,
    {
      params: { country },
      headers: { Authorization: `Bearer ${secretKey}` },
    },
  );
  return response.data.data.map((bank) => ({
    code: bank.code,
    name: bank.name,
  }));
}

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const verifyBankAccount = async (
  accountNumber: string,
  bankCode: string,
) => {
  try {
    const { data } = await paystack.get('/bank/resolve', {
      params: { account_number: accountNumber, bank_code: bankCode },
    });
    return data; // { status: true, message: "...", data: { account_number, account_name, ... } }
  } catch (err: any) {
    logger.error('Paystack verification failed', {
      accountNumber,
      bankCode,
      error: err.response?.data || err.message,
    });
    throw err;
  }
};
