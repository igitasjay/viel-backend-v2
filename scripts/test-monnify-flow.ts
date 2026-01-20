import crypto from 'crypto';

const BASE_URL = 'http://localhost:1200/api/v1';
const MONNIFY_SECRET = process.env.MONNIFY_SECRET_KEY as string; // Fallback to what was in env

async function runTest() {
  const timestamp = Date.now();
  const userData = {
    firstname: 'Test',
    lastname: 'User',
    email: 'imailasjay@gmail.com',
    password: '123456',
    phone: `080${timestamp.toString().slice(-8)}`
  };

  try {
    console.log('--- 1. Register User (SKIPPED - Using existing user) ---');
    /*
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const regJson = await regRes.json();
    if (!regRes.ok) throw new Error(`Register failed: ${JSON.stringify(regJson)}`);
    // console.log('Registered JSON:', regJson);
    const otp = regJson.title?.otp;
    const email = regJson.title?.email;
    console.log(`Registered. OTP: ${otp}`);

    console.log('--- 1.5. Verify Email ---');
    if (!otp) throw new Error('OTP not found in register response');
    
    // The route is actually /verify-otp based on routes file
    const emailVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const emailVerifyJson = await emailVerifyRes.json();
    if (!emailVerifyRes.ok) throw new Error(`Verify failed: ${JSON.stringify(emailVerifyJson)}`);
    console.log('Email verified.');
    */

    console.log('--- 2. Login ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userData.email, password: userData.password }),
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
    // console.log('Login JSON:', JSON.stringify(loginJson, null, 2));
    const token = loginJson.accessToken;
    if (!token) throw new Error('No access token in login response');
    console.log('Logged in. Token acquired.');

    console.log('--- 2.5. Get Current User ---');
    const userRes = await fetch(`${BASE_URL}/users/current`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const userJson = await userRes.json();
    if (!userRes.ok) throw new Error(`Get User failed: ${JSON.stringify(userJson)}`);
    console.log('User JSON:', JSON.stringify(userJson, null, 2));
    const userId = userJson.user?._id; 
    console.log('User ID:', userId);

    console.log('--- 3. Setup Passcode ---');
    const setupPassRes = await fetch(`${BASE_URL}/authorisation/setup-passcode`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ passcode: '1234' }),
    });
    const setupPassJson = await setupPassRes.json();
    if (!setupPassRes.ok) throw new Error(`Setup Passcode failed: ${JSON.stringify(setupPassJson)}`);
    console.log('Passcode set.');

    console.log('--- 4. Authorize Transaction (Get Grant) ---');
    const authTxRes = await fetch(`${BASE_URL}/authorisation/authorize-txn`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: userId, passcode: '1234' }),
    });
    const authTxJson = await authTxRes.json();
    if (!authTxRes.ok) throw new Error(`Authorize Txn failed: ${JSON.stringify(authTxJson)}`);
    console.log('Transaction Authorized:', authTxJson.message);

    console.log('--- 4.5. Get Valid Gift Card ---');
    // Adjust endpoint based on route file inspection
    const countryRes = await fetch(`${BASE_URL}/giftcard/countries`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const countryJson = await countryRes.json();
     if (!countryRes.ok) throw new Error(`Get Countries failed: ${JSON.stringify(countryJson)}`);
    
    // Assuming structure based on previous knowledge or common sense, will log to debug if needed
    // Usually it returns a list of countries with gift cards or similar. 
    // Let's assume we can get a card ID from somewhere deep in the response or need another call.
    // For now, let's just log and try to pick one if obvious, or just create a valid fake ObjectID if we can't easily find one.
    // Actually, creating a fake valid ObjectId is easier if we just need *any* valid format, but if it checks DB, we need real one.
    
    // Better approach: Let's assume there's at least one gift card seeded.
    // Since I don't know the exact response structure of /countries without checking, I'll assume it returns *something*.
    // Converting 'dummy_id' to a valid 24-char hex string might get past the cast error, but might fail "not found".
    // Let's try to find a real one.
    
    console.log('Country/Card Data:', JSON.stringify(countryJson, null, 2));
    
    // Only proceed if we can find an ID. For now, let's use a 24-char hex string to pass the CAST check, 
    // and if it fails with 404, we know we need a real ID.
    // But checking the previous error, it was a CastError. 
    const fakeId = '507f1f77bcf86cd799439011'; 
    let realId = fakeId;

    // Try to extract if possible
    if(countryJson.data && countryJson.data.length > 0 && countryJson.data[0].giftCards && countryJson.data[0].giftCards.length > 0) {
        realId = countryJson.data[0].giftCards[0]._id;
        console.log('Found Real GiftCard ID:', realId);
    } else {
        console.log('Using Fake ID (might fail 404):', realId);
    }
    
    console.log('--- 5. Initiate Gift Card Purchase ---');
    const purchaseRes = await fetch(`${BASE_URL}/giftcard/buy`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        giftCardId: realId,
        amount: 1000,
        quantity: 1,
        email: 'recipient@example.com' 
      }),
    });
    const purchaseJson = await purchaseRes.json();
    if (!purchaseRes.ok) throw new Error(`Purchase Init failed: ${JSON.stringify(purchaseJson)}`);
    const reference = purchaseJson.data.reference;
    console.log('Purchase Initialized. Reference:', reference);

    console.log('--- 5.5. Init Monnify Bank Transfer (Frontend Step) ---');
    // The frontend would call this to get the account number
    const bankTransferRes = await fetch(`${BASE_URL}/monnify/init-bank-transfer`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            transactionReference: reference, 
            bankCode: '035' // Wema Bank, usually available in sandbox
        }), 
    });
    const bankTransferJson = await bankTransferRes.json();
    if (!bankTransferRes.ok) {
        console.error('Bank Transfer Init failed:', JSON.stringify(bankTransferJson));
        // Don't fail the whole test if this fails, as it might be network/sandbox specific, 
        // but it's good to know. The flow can technically proceed via webhook simulation.
        // actually, we WANT to test this because we just refactored the service!
        throw new Error(`Bank Transfer Init failed: ${JSON.stringify(bankTransferJson)}`);
    }
    console.log('Bank Transfer Initialized. Account:', bankTransferJson.data?.responseBody?.accountNumber);

    // Also check get details
    console.log('--- 5.6. Get Monnify Details ---');
    try {
        const detailsRes = await fetch(`${BASE_URL}/monnify/transfer-details/${encodeURIComponent(reference)}`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        const detailsJson = await detailsRes.json();
        // This might fail if the transaction isn't "on monnify" yet in the way fetching details expects, 
        // or if it works immediately. 
        // If it fails 404 from Monnify side, that's okay, but we want to see if our service throws correctly.
        console.log('Get details response code:', detailsRes.status);
    } catch (e) {
        console.log('Get details failed (expected if ref invalid on monnify yet):', e);
    }

    console.log('--- 6. Simulate Monnify Webhook ---');
    const webhookPayload = {
      eventType: 'SUCCESSFUL_TRANSACTION',
      eventData: {
        transactionReference: 'MNFY|TEST|' + timestamp,
        paymentReference: reference,
        amountPaid: 1000,
        totalPayable: 1000,
        paidOn: new Date().toISOString(),
        paymentStatus: 'PAID',
        paymentDescription: 'Test Payment',
        transactionHash: 'hash',
        currency: 'NGN',
        paymentMethod: 'ACCOUNT_TRANSFER',
      }
    };

    const signature = crypto
      .createHmac('sha512', MONNIFY_SECRET)
      .update(JSON.stringify(webhookPayload))
      .digest('hex');

    const webhookRes = await fetch(`${BASE_URL}/monnify/webhook`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'monnify-signature': signature
      },
      body: JSON.stringify(webhookPayload),
    });
    const webhookText = await webhookRes.text();
    console.log('Webhook Response:', webhookText);

    if (webhookText !== 'Webhook processed') {
        throw new Error('Webhook processing failed or was ignored');
    }

    console.log('--- 7. Verify Status (Manual Check Endpoint) ---');
    // Calling verify on a PAID transaction should return 'already paid' or similar
    const verifyRes = await fetch(`${BASE_URL}/transactions/${reference}/verify`, {
        method: 'POST',
         headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    const verifyJson = await verifyRes.json();
    console.log('Verify Response:', verifyJson);
    
    if (verifyJson.status === 'paid' || verifyJson.status === 'completed') {
        console.log('SUCCESS: Transaction validated as PAID!');
    } else {
        console.error('FAILURE: Transaction not marked as paid.');
    }

  } catch (error) {
    console.error('TEST FAILED:', error);
  }
}

runTest();
