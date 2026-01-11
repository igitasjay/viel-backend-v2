import { Router } from 'express';
import { getRates, buyCrypto } from '../controllers/trade.controller';

const router = Router();
router.get('/rates', getRates);
router.post('/buy', buyCrypto);
// router.post('/sell', sellCrypto);
export default router;
