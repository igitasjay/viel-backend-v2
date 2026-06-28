import {
  MonnifyAuthResponse,
  MonnifyBankTransferRequest,
  MonnifyBankTransferResponse,
  MonnifyTransactionResponse,
  MonnifyInitTransactionRequest,
  MonnifyInitTransactionResponse,
} from '@/types/monnify.type';
import axios from 'axios';
import config from '@/config/config';
import { logger } from '@/lib/winston';

const MONNIFY_API_KEY = config.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = config.MONNIFY_SECRET_KEY;
const MONNIFY_BASE_URL = config.MONNIFY_BASE_URL;

// Access token memory cache to avoid spamming login
let accessTokenCache: { token: string; expiresAt: number } | null = null;

// Obtain an access token from Monnify
export async function getMonnifyAccessToken(): Promise<string> {
  // Return cached token if valid (buffer 60s)
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60000) {
    return accessTokenCache.token;
  }

  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
    throw new Error('MONNIFY_API_KEY or MONNIFY_SECRET_KEY not set in environment');
  }

  const authString = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');

  try {
    const response = await axios.post<MonnifyAuthResponse>(
      `https://${MONNIFY_BASE_URL}/api/v1/auth/login`,
      {},
      {
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.requestSuccessful && response.data.responseBody?.accessToken) {
      const expiresIn = response.data.responseBody.expiresIn || 3600; // Default 1h
      accessTokenCache = {
        token: response.data.responseBody.accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      return response.data.responseBody.accessToken;
    } else {
      console.error('Monnify Auth Error Response:', response.data);
      throw new Error(response.data.responseMessage || 'Failed to get Monnify access token');
    }
  } catch (error: any) {
    // Log only the message to avoid circular JSON print
    console.error('Monnify Auth API error:', error.message);

    // Throw simplified error
    const safeError = new Error(error.response?.data?.responseMessage || error.message || 'Monnify Auth Failed') as any;
    safeError.status = error.response?.status;
    safeError.monnifyResponse = error.response?.data;
    throw safeError;
  }
}

// Fetch transaction details by transaction reference
export async function getMonnifyTransactionDetails(
  transactionReference: string,
): Promise<MonnifyTransactionResponse> {
  const accessToken = await getMonnifyAccessToken();

  try {
    const response = await axios.get<MonnifyTransactionResponse>(
      `https://${MONNIFY_BASE_URL}/api/v2/transactions/${encodeURIComponent(transactionReference)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error: any) {
    console.error('Monnify Transaction API error:', error.message);

    const safeError = new Error(error.response?.data?.responseMessage || error.message || 'Monnify transaction fetch failed') as any;
    safeError.status = error.response?.status;
    safeError.monnifyResponse = error.response?.data;
    throw safeError;
  }
}

// Initialize a bank transfer to get a dynamic account number
export async function initMonnifyBankTransfer(
  payload: MonnifyBankTransferRequest,
): Promise<MonnifyBankTransferResponse> {
  const accessToken = await getMonnifyAccessToken();
  logger.info('initMonnifyBankTransfer: Starting Monnify Bank Transfer init process', { payload });

  try {
    const response = await axios.post<MonnifyBankTransferResponse>(
      `https://${MONNIFY_BASE_URL}/api/v1/merchant/bank-transfer/init-payment`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error: any) {
    logger.error('initMonnifyBankTransfer: Monnify Bank Transfer init failed', { error });

    const safeError = new Error(error.response?.data?.responseMessage || error.message || 'Monnify bank transfer init failed') as any;
    safeError.status = error.response?.status;
    safeError.monnifyResponse = error.response?.data;
    throw safeError;
  }
}

// Generic status query by reference (Transaction Ref or Payment Ref)
export async function getMonnifyTransactionStatus(
  reference: string,
  isPaymentReference: boolean = true,
): Promise<MonnifyTransactionResponse> {
  const accessToken = await getMonnifyAccessToken();
  const queryKey = isPaymentReference ? 'paymentReference' : 'transactionReference';

  try {
    const response = await axios.get<MonnifyTransactionResponse>(
      `https://${MONNIFY_BASE_URL}/api/v2/merchant/transactions/query`,
      {
        params: { [queryKey]: reference },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Monnify Query API error:', error.message);

    const safeError = new Error(error.response?.data?.responseMessage || error.message || 'Monnify transaction query failed') as any;
    safeError.status = error.response?.status;
    safeError.monnifyResponse = error.response?.data;
    throw safeError;
  }
}

// Step 1: Initialize Transaction (Get Transaction Reference)
export async function initMonnifyTransaction(
  payload: MonnifyInitTransactionRequest,
): Promise<MonnifyInitTransactionResponse> {
  const accessToken = await getMonnifyAccessToken();
  logger.info('initMonnifyTransaction: Starting Monnify Init Transaction process', { payload });

  try {
    const response = await axios.post<MonnifyInitTransactionResponse>(
      `https://${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Monnify Init Transaction API error:', error.message);

    const safeError = new Error(error.response?.data?.responseMessage || error.message || 'Monnify init transaction failed') as any;
    safeError.status = error.response?.status;
    safeError.monnifyResponse = error.response?.data;
    throw safeError;
  }
}

// Disburse funds to a local bank account
export async function disburseFunds(payload: {
  amount: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
  currency: string;
}): Promise<any> {
  const accessToken = await getMonnifyAccessToken();

  try {
    const response = await axios.post(
      `https://${MONNIFY_BASE_URL}/api/v1/disbursements/single`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Monnify Disbursement API error:', error.message);
    const safeError = new Error(error.response?.data?.responseMessage || error.message || 'Monnify disbursement failed') as any;
    safeError.status = error.response?.status;
    safeError.monnifyResponse = error.response?.data;
    throw safeError;
  }
}

// Fetch list of supported banks from Monnify
export async function getMonnifyBanks(): Promise<any> {
  const accessToken = await getMonnifyAccessToken();

  try {
    const response = await axios.get(
      `https://${MONNIFY_BASE_URL}/api/v1/banks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Monnify Banks API error:', error.message);
    const safeError = new Error(error.response?.data?.responseMessage || error.message || 'Monnify bank list fetch failed') as any;
    safeError.status = error.response?.status;
    safeError.monnifyResponse = error.response?.data;
    throw safeError;
  }
}

// Resolve bank account details (Verify Account Name)
export async function resolveMonnifyBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<any> {
  const accessToken = await getMonnifyAccessToken();

  try {
    const response = await axios.get(
      `https://${MONNIFY_BASE_URL}/api/v1/disbursements/account/validate`,
      {
        params: { accountNumber, bankCode },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error('Monnify Account Resolution API error:', error.message);
    const safeError = new Error(error.response?.data?.responseMessage || error.message || 'Monnify account resolution failed') as any;
    safeError.status = error.response?.status;
    safeError.monnifyResponse = error.response?.data;
    throw safeError;
  }
}
