// src/routes/v1/fiat.routes.ts
import { Router } from 'express';
import authenticate from '@/middlewares/authenticate.middleware';
import restrictSuspended from '@/middlewares/restrict-suspended.middleware';
import {
  initializeBuyCrypto,
  verifyPayment,
} from '@/controllers/fiat/fiat.controller';

const router = Router();

router.post('/buy-crypto', authenticate, restrictSuspended, initializeBuyCrypto);
router.get('/verify/:reference', verifyPayment); // Public (post-payment)

export default router;
