// routes/depositRoutes.ts
import { Router } from 'express';
import {
  allocateAddress,
  getDeposit,
  listUserDeposits,
} from '../controllers/deposit.controller';
import authenticate from '@/middlewares/authenticate.middleware';

const router = Router();

router.use(authenticate);

router.post('/address', allocateAddress);
router.get('/tx/:txHash', getDeposit);
router.get('/user/:userId', listUserDeposits);

export default router;
