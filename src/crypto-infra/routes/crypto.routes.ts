import { Router } from 'express';
import {
  fetchAllCurrencies,
} from '../controllers/crypto.controller';
import { getRates, buyCrypto } from '../controllers/trade.controller';
import restrictSuspended from '@/middlewares/restrict-suspended.middleware';
import verifyUser from '@/middlewares/verify-user.middleware';
import authenticate from '@/middlewares/authenticate.middleware';

const router = Router();
router.get('/coins/all', fetchAllCurrencies);
router.get('/rates', getRates);
router.post('/buy', authenticate, restrictSuspended, verifyUser, buyCrypto);

export default router;
