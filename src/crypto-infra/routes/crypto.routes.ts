import { Router } from 'express';
import {
  fetchAllCurrencies,
} from '../controllers/crypto.controller';
import { getRates, buyCrypto } from '../controllers/trade.controller';
import restrictSuspended from '@/middlewares/restrict-suspended.middleware';

const router = Router();
router.get('/coins/all', fetchAllCurrencies);
router.get('/rates', getRates);
router.post('/buy', restrictSuspended, buyCrypto);

export default router;
