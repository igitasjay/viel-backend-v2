import { Router } from 'express';
import {
  fetchAllCurrencies,
} from '../controllers/crypto.controller';
import { getRates, buyCrypto } from '../controllers/trade.controller';

const router = Router();
router.get('/coins/all', fetchAllCurrencies);
router.get('/rates', getRates);
router.post('/buy', buyCrypto);

export default router;
