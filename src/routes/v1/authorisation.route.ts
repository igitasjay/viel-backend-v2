import { Router } from 'express';
import authenticate from '@/middlewares/authenticate.middleware';
import { createPasscode, verifyPassword } from '@/lib/authorisation/passcode';
import { validateTxGrant } from '@/middlewares/validate-txn';

import { authorizeTransaction } from '@/lib/authorisation/authorise-txn';

const router = Router();

router.post('/setup-passcode', authenticate, createPasscode);
router.post('/verify-password', authenticate, verifyPassword);
router.post('/authorize-txn', authenticate, authorizeTransaction);
router.post('/execute-payment', validateTxGrant, (req, res) => {
  res.send('Payment processed successfully.');
});

export default router;
