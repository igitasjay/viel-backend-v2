
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
    
    console.log('Initializing transaction with paymentReference:', paymentRef);
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
    console.log('Success! Monnify Transaction Reference:', transactionRef);

    // 2. Query Status by paymentReference
    try {
      console.log('\nQuerying by paymentReference:', paymentRef);
      const query1 = await axios.get(`https://${MONNIFY_BASE_URL}/api/v2/transactions/query`, {
        params: { paymentReference: paymentRef },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Query 1 (paymentRef):', query1.data.requestSuccessful);
    } catch (e) {
      console.log('Query 1 (paymentRef) FAILED:', e.response ? e.response.data.responseMessage : e.message);
    }

    // 3. Query Status by transactionReference
    try {
      console.log('\nQuerying by transactionReference:', transactionRef);
      const query2 = await axios.get(`https://${MONNIFY_BASE_URL}/api/v2/transactions/query`, {
        params: { transactionReference: transactionRef },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Query 2 (transactionRef):', query2.data.requestSuccessful);
      console.log('Status reported:', query2.data.responseBody.paymentStatus);
    } catch (e) {
      console.log('Query 2 (transactionRef) FAILED:', e.response ? e.response.data.responseMessage : e.message);
    }

  } catch (error) {
    console.log('Critical Error:', error.response ? error.response.data : error.message);
  }
  process.exit(0);
}

run();
