
import 'dotenv/config';
import { initMonnifyBankTransfer } from '../src/services/monnify.service';

const runDebug = async () => {
  try {
    const simpleRef = `debug_${Date.now()}`;
    console.log(`Testing simple reference as paymentReference: ${simpleRef}`);
    
    // We need to test sending "paymentReference" instead of "transactionReference"
    // Since initMonnifyBankTransfer is typed, we might need to modify the service or bypass type here.
    // Ideally we modify the service to support this experiment or use axios directly here.
    // Let's use axios directly to be sure what we are sending.
    
    const { getMonnifyAccessToken } = require('../src/services/monnify.service');
    const axios = require('axios');
    const accessToken = await getMonnifyAccessToken();
    
    console.log('Got access token, calling init-payment...');
    
    try {
        const payload = {
            transactionReference: simpleRef, // trying as transactionReference first (we know this fails)
            amount: 100,
            customerName: 'Debug User',
            customerEmail: 'debug@example.com',
            paymentDescription: 'Debug Payment',
            currencyCode: 'NGN',
            contractCode: process.env.MONNIFY_CONTRACT_CODE!,
        };
       // console.log('Payload (Attempt 1):', payload);
       // const response = await axios.post(`https://${process.env.MONNIFY_API_URL}/api/v1/merchant/bank-transfer/init-payment`, payload, {
       //     headers: { Authorization: `Bearer ${accessToken}` }
       // });
       // console.log('Success 1:', response.data);
    } catch(e: any) {
        // console.log('Fail 1:', e.response?.data);
    }

    const MONNIFY_BASE_URL = process.env.MONNIFY_API_URL || 'sandbox.monnify.com';

    // Attempt 2: paymentReference
    try {
        const payload2 = {
            paymentReference: simpleRef, 
            amount: 100,
            customerName: 'Debug User',
            customerEmail: 'debug@example.com',
            paymentDescription: 'Debug Payment',
            currencyCode: 'NGN',
            contractCode: process.env.MONNIFY_CONTRACT_CODE!,
        };
        console.log('Payload (Attempt 2 - paymentReference):', payload2);
        
        const response2 = await axios.post(`https://${MONNIFY_BASE_URL}/api/v1/merchant/bank-transfer/init-payment`, payload2, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.log('Success 2:', response2.data);
    } catch(e: any) {
        console.log('Fail 2:', e.response?.data || e.message);
    }

    // Attempt 3: The Full Flow (Init Transaction -> Init Payment)
    try {
        console.log('Attempt 3: Init Transaction first...');
        const initTxPayload = {
            amount: 100,
            customerName: 'Debug User',
            customerEmail: 'debug@example.com',
            paymentReference: `flow_${Date.now()}`,
            paymentDescription: 'Flow Test',
            currencyCode: 'NGN',
            contractCode: process.env.MONNIFY_CONTRACT_CODE!,
            redirectUrl: 'http://localhost:3000',
            paymentMethods: ["ACCOUNT_TRANSFER"]
        };
        
        const initTxRes = await axios.post(`https://${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, initTxPayload, {
             headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const monnifyTransRef = initTxRes.data.responseBody.transactionReference;
        console.log('Got Monnify Ref:', monnifyTransRef);
        
        // NOW call init-payment with this ref
        const payload3 = {
            transactionReference: monnifyTransRef,
            bankCode: '035', // Wema bank code usually, or optional?
             // "This endpoint... to generate a virtual account number..."
             // Re-reading docs: init-payment needs transactionReference.
        };
        
        console.log('Calling init-payment with Monnify Ref:', payload3);
        const response3 = await axios.post(`https://${MONNIFY_BASE_URL}/api/v1/merchant/bank-transfer/init-payment`, payload3, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.log('Success 3:', JSON.stringify(response3.data, null, 2));

    } catch(e: any) {
        console.log('Fail 3:', e.response?.data || e.message);
    }

  } catch (error: any) {
    console.error('Debug script failed:', error.message);
  }
};

runDebug();
