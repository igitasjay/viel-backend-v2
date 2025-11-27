import https from 'https';
import {
  ChargeBankRequest,
  PaystackResponse,
  SubmitOtpRequest,
} from '../types/paystack.type';

const PAYSTACK_API_URL = 'api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function chargeBankAccount(
  payload: ChargeBankRequest,
): Promise<PaystackResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY not set in environment');
  }

  // Log input payload
  console.log('Paystack request payload:', JSON.stringify(payload, null, 2));

  // Stringify payload
  const requestBody = JSON.stringify(payload);
  const contentLength = Buffer.byteLength(requestBody);

  // Request options
  const options = {
    hostname: PAYSTACK_API_URL,
    port: 443,
    path: '/charge',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': contentLength,
    },
  };

  // Log request details
  console.log('Paystack https request:', {
    body: requestBody,
    headers: options.headers,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data) as PaystackResponse;
          if (res.statusCode && res.statusCode >= 400) {
            const error = new Error('Paystack charge failed') as any;
            error.paystackResponse = response;
            error.status = res.statusCode;
            reject(error);
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Paystack API error:', error.message);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

export async function submitOtp(
  payload: SubmitOtpRequest,
): Promise<PaystackResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY not set in environment');
  }

  // Log input payload
  console.log(
    'Paystack OTP request payload:',
    JSON.stringify(payload, null, 2),
  );

  // Stringify payload
  const requestBody = JSON.stringify(payload);
  const contentLength = Buffer.byteLength(requestBody);

  // Request options
  const options = {
    hostname: PAYSTACK_API_URL,
    port: 443,
    path: '/charge/submit_otp',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': contentLength,
    },
  };

  // Log request details
  console.log('Paystack OTP https request:', {
    body: requestBody,
    headers: options.headers,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data) as PaystackResponse;
          if (res.statusCode && res.statusCode >= 400) {
            const error = new Error('Paystack OTP submission failed') as any;
            error.paystackResponse = response;
            error.status = res.statusCode;
            reject(error);
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Paystack OTP API error:', error.message);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}
