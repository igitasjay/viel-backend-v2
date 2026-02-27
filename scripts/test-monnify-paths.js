
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
    const paymentRef = 'test_path_v2_' + Date.now();
    
    console.log('Initializing...');
    const initResponse = await axios.post(`https://${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
      amount: 100,
      customerName: 'Test Path User',
      customerEmail: 'test@example.com',
      paymentReference: paymentRef,
      paymentDescription: 'Test Path V2',
      currencyCode: 'NGN',
      contractCode: MONNIFY_CONTRACT_CODE,
      redirectUrl: 'http://localhost:3000',
      paymentMethods: ["ACCOUNT_TRANSFER"]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const transactionRef = initResponse.data.responseBody.transactionReference;
    console.log('Success! Tx Ref:', transactionRef);

    // Wait 10s
    console.log('Waiting 10s...');
    await new Promise(r => setTimeout(r, 10000));

    const variants = [
      { name: 'V2 without /merchant/', url: `https://${MONNIFY_BASE_URL}/api/v2/transactions/query` },
      { name: 'V2 with /merchant/', url: `https://${MONNIFY_BASE_URL}/api/v2/merchant/transactions/query` },
      { name: 'V1 with /merchant/', url: `https://${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query` }
    ];

    for (const v of variants) {
      try {
        console.log(`\nTesting ${v.name}: ${v.url}`);
        const res = await axios.get(v.url, {
          params: { transactionReference: transactionRef },
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Result: ${res.data.requestSuccessful ? 'SUCCESS' : 'FAILURE'} (${res.data.responseMessage})`);
      } catch (e) {
        console.log(`Result: ERROR (${e.response ? e.response.data.responseMessage : e.message})`);
      }
    }

  } catch (error) {
    console.log('Critical Error:', error.response ? error.response.data : error.message);
  }
  process.exit(0);
}

run();
