import { Router } from 'express';
import authenticate from '@/middlewares/authenticate.middleware';
import { createPasscode } from '@/lib/authorisation/passcode';
import { validateTxGrant } from '@/middlewares/validate-txn';

const router = Router();

router.post('/setup-passcode', authenticate, createPasscode);
router.post('/execute-payment', validateTxGrant, (req, res) => {
  res.send('Payment processed successfully.');
});

export default router;
