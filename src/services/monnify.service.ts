import https from 'https';
import { MonnifyAuthResponse, MonnifyTransactionResponse, MonnifyBankTransferRequest, MonnifyBankTransferResponse } from '../types/monnify.type';

const MONNIFY_API_URL = 'sandbox.monnify.com'; // Use 'api.monnify.com' for production
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;

/**
 * Fetches an access token from Monnify API.
 */
export async function getMonnifyAccessToken(): Promise<string> {
  if (!MONNIFY_API_KEY || !MONNIFY_SECRET_KEY) {
    throw new Error('MONNIFY_API_KEY or MONNIFY_SECRET_KEY not set in environment');
  }

  const authString = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');

  const options = {
    hostname: MONNIFY_API_URL,
    port: 443,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data) as MonnifyAuthResponse;
          if (response.requestSuccessful && response.responseBody?.accessToken) {
            resolve(response.responseBody.accessToken);
          } else {
            console.error('Monnify Auth Error:', response);
            reject(new Error(response.responseMessage || 'Failed to get Monnify access token'));
          }
        } catch (error) {
          reject(new Error('Failed to parse Monnify auth response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Monnify Auth API error:', error.message);
      reject(error);
    });

    req.end();
  });
}

/**
 * Fetches bank transfer details by transaction reference.
 */
export async function getMonnifyTransactionDetails(
  transactionReference: string,
): Promise<MonnifyTransactionResponse> {
  const accessToken = await getMonnifyAccessToken();

  const options = {
    hostname: MONNIFY_API_URL,
    port: 443,
    path: `/api/v2/transactions/${encodeURIComponent(transactionReference)}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data) as MonnifyTransactionResponse;
          if (res.statusCode && res.statusCode >= 400) {
            const error = new Error('Monnify transaction fetch failed') as any;
            error.monnifyResponse = response;
            error.status = res.statusCode;
            reject(error);
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error('Failed to parse Monnify transaction response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Monnify Transaction API error:', error.message);
      reject(error);
    });

    req.end();
  });
}

/**
 * Initializes a bank transfer and fetches dynamic account details.
 */
export async function initMonnifyBankTransfer(
  payload: MonnifyBankTransferRequest,
): Promise<MonnifyBankTransferResponse> {
  const accessToken = await getMonnifyAccessToken();

  const requestBody = JSON.stringify(payload);

  const options = {
    hostname: MONNIFY_API_URL,
    port: 443,
    path: '/api/v1/merchant/bank-transfer/init-payment',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data) as MonnifyBankTransferResponse;
          if (res.statusCode && res.statusCode >= 400) {
            const error = new Error('Monnify bank transfer initialization failed') as any;
            error.monnifyResponse = response;
            error.status = res.statusCode;
            reject(error);
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error('Failed to parse Monnify bank transfer response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Monnify Bank Transfer API error:', error.message);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Queries transaction status by payment reference or transaction reference.
 */
export async function getMonnifyTransactionStatus(
  reference: string,
  isPaymentReference: boolean = true,
): Promise<MonnifyTransactionResponse> {
  const accessToken = await getMonnifyAccessToken();

  const queryKey = isPaymentReference ? 'paymentReference' : 'transactionReference';
  const options = {
    hostname: MONNIFY_API_URL,
    port: 443,
    path: `/api/v2/transactions/query?${queryKey}=${encodeURIComponent(reference)}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data) as MonnifyTransactionResponse;
          if (res.statusCode && res.statusCode >= 400) {
            const error = new Error('Monnify transaction query failed') as any;
            error.monnifyResponse = response;
            error.status = res.statusCode;
            reject(error);
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error('Failed to parse Monnify transaction response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Monnify Query API error:', error.message);
      reject(error);
    });

    req.end();
  });
}
