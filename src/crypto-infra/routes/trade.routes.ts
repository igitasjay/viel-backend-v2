import { Router } from 'express';
import { getRates, buyCrypto } from '../controllers/trade.controller';
import verifyUser from '@/middlewares/verify-user.middleware';
import authenticate from '@/middlewares/authenticate.middleware';

const router = Router();
router.get('/rates', getRates);
router.post('/buy', authenticate, verifyUser, buyCrypto);
// router.post('/sell', sellCrypto);
export default router;
