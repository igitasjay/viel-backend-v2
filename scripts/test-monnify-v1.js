
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

async function run() {
  try {
    const token = await getAccessToken();
    const paymentRef = 'gift_69948ee1f4086a4376f06064_1772164156725'; // The user's actual reference
    
    console.log('Querying V1 by paymentReference:', paymentRef);
    const qV1 = await axios.get(`https://${MONNIFY_BASE_URL}/api/v1/merchant/transactions/query`, {
      params: { paymentReference: paymentRef },
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('V1 result successful:', qV1.data.requestSuccessful);
    if (qV1.data.requestSuccessful) {
        console.log('Status recorded:', qV1.data.responseBody.paymentStatus);
    } else {
        console.log('V1 FAILED even with paymentReference:', qV1.data.responseMessage);
    }

  } catch (error) {
    console.log('Error:', error.response ? error.response.data : error.message);
  }
  process.exit(0);
}

run();
