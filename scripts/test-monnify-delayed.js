
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
const MONNIFY_BASE_URL = 'sandbox.monnify.com';

async function getAccessToken() {
  const authString = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
  const response = await axios.post(`https://${MONNIFY_BASE_URL}/api/v1/auth/login`, {}, {
    headers: { Authorization: `Basic ${authString}` }
  });
  return response.data.responseBody.accessToken;
}

async function run() {
  try {
    const token = await getAccessToken();
    const paymentRef = 'test_ref_' + Date.now();
    
    console.log('Initializing...');
    const initResponse = await axios.post(`https://${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
      amount: 100,
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      paymentReference: paymentRef,
      paymentDescription: 'Test Description',
      currencyCode: 'NGN',
      contractCode: MONNIFY_CONTRACT_CODE,
      redirectUrl: 'http://localhost:3000',
      paymentMethods: ["ACCOUNT_TRANSFER"]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const transactionRef = initResponse.data.responseBody.transactionReference;
    console.log('Success! Tx Ref:', transactionRef);

    console.log('Waiting 10 seconds for sandbox to catch up...');
    await new Promise(r => setTimeout(r, 10000));

    // Try V2 query
    try {
      console.log('\nQuerying V2 by transactionReference:', transactionRef);
      const qV2 = await axios.get(`https://${MONNIFY_BASE_URL}/api/v2/transactions/query`, {
        params: { transactionReference: transactionRef },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('V2 result successful:', qV2.data.requestSuccessful);
    } catch (e) {
      console.log('V2 FAILED:', e.response ? e.response.data.responseMessage : e.message);
    }

    // Try V1 query (if it exists)
    try {
      console.log('\nQuerying V1 by transactionReference:', transactionRef);
      const qV1 = await axios.get(`https://${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query`, {
        params: { transactionReference: transactionRef },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('V1 result successful:', qV1.data.requestSuccessful);
    } catch (e) {
      console.log('V1 FAILED:', e.response ? e.response.data.responseMessage : e.message);
    }

  } catch (error) {
    console.log('Critical Error:', error.response ? error.response.data : error.message);
  }
  process.exit(0);
}

run();
