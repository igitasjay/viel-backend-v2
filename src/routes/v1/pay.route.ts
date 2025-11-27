// import Router from 'express';
// import authenticate from '@/middlewares/authenticate';
// // import {
// //   createPaystackRecipient,
// //   getPaystackBanks,
// //   initiatePaystackTransfer,
// // } from '@/services/paystack';
// import config from '@/config';
// const router = Router();

// const secretKey = config.PAYSTACK_SECRET_KEY;
// router.post('/initiate', authenticate, async (req, res) => {
//   try {
//     // Create recipient (or fetch from DB)
//     const recipientCode = await createPaystackRecipient(secretKey, {
//       type: 'nuban',
//       name: '',
//       account_number: '',
//       bank_code: '', // Zenith Bank
//       currency: 'NGN',
//     });

//     const result = await initiatePaystackTransfer(secretKey, {
//       source: 'balance',
//       amount: 100000,
//       recipient: recipientCode, // ← now dynamic
//       reference: `txn_${Date.now()}`,
//       currency: 'NGN',
//     });

//     res.json(result);
//   } catch (error: any) {
//     const safeError = {
//       message: error.message,
//       status: error.response?.status,
//       data: error.response?.data,
//     };
//     console.error('Transfer failed:', safeError);
//     res.status(500).json({ error: 'Transfer failed', details: safeError });
//   }
// });

// // Example: GET /banks
// router.get('/banks', authenticate, async (req, res) => {
//   try {
//     //     const secretKey = process.env.PAYSTACK_SECRET_KEY!;
//     const banks = await getPaystackBanks(secretKey, 'nigeria');
//     res.json(banks);
//   } catch (error: any) {
//     const safeError = { message: error.message };
//     console.error('Fetch banks failed:', safeError);
//     res.status(500).json({ error: 'Failed to fetch banks' });
//   }
// });

// export default router;
