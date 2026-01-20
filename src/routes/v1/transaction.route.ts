import { Router } from 'express';
import { getTransactionHistory } from '@/controllers/user/transaction.controller';
import authenticate from '@/middlewares/authenticate.middleware';

const router = Router();

router.get('/history', authenticate, getTransactionHistory);

export default router;
