
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
const MONNIFY_BASE_URL = 'sandbox.monnify.com';

async function getAccessToken() {
  const authString = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
  const response = await axios.post(`https://${MONNIFY_BASE_URL}/api/v1/auth/login`, {}, {
    headers: { Authorization: `Basic ${authString}` }
  });
  return response.data.responseBody.accessToken;
}

async function queryStatus(ref, isPaymentRef) {
  const token = await getAccessToken();
  const queryKey = isPaymentRef ? 'paymentReference' : 'transactionReference';
  try {
    const response = await axios.get(`https://${MONNIFY_BASE_URL}/api/v2/transactions/query`, {
      params: { [queryKey]: ref },
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Query for ${queryKey}=${ref}:`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`Error querying ${queryKey}=${ref}:`, error.response ? error.response.data : error.message);
  }
}

async function run() {
  const internalRef = 'gift_69948ee1f4086a4376f06064_1772164156725';
  const monnifyRef = 'MNFY|16|20260227044918|000633';
  
  await queryStatus(internalRef, true);
  await queryStatus(monnifyRef, false);
  process.exit(0);
}

run();
