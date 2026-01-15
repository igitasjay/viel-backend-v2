import { Router } from 'express';
import authRouter from '@/routes/v1/auth.route';
import userRouter from '@/routes/v1/user.route';
// import payRouter from '@/routes/v1/pay';
import bankRouter from '@/routes/v1/banks.route';
// import cryptoRouter from '@/routes/v1/crypto.route';
import chargeRouter from '@/routes/v1/charge.route';
// import cryptoRoute from '@/crypto/routes/deposit.route';
import adminGiftCardRoute from '@/routes/v1/admin.routes';
import authorisationRoute from '@/routes/v1/authorisation.route';
import initializeRedisClient from '@/config/redis.config';

import walletRoutes from '../../crypto-infra/routes/wallet.routes';
import tradeRoutes from '../../crypto-infra/routes/trade.routes';
import webhookRoutes from '../../crypto-infra/routes/webhook.routes';
import adminRoutes from '../../crypto-infra/routes/admin.routes';
import authenticate from '@/middlewares/authenticate.middleware';
import userCryptoRoute from '../../crypto-infra/routes/crypto.routes';
import giftcardRoute from '@/routes/v1/giftcard.route';

const router = Router();

router.get('/', async (req, res) => {
  res.status(200).json({
    message: 'API is live!!',
    status: 'ok',
    version: '1.0.0',
    docs: '/docs',
    timestamp: new Date().toISOString(),
  });
});

router.post('/red', async (req, res) => {
  const data = req.body;
  const client = await initializeRedisClient();
  res.send('redis thing');
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
// router.use('/pay', payRouter);
router.use('/banks', bankRouter);
// router.use('/crypto', cryptoRouter);
router.use('/charge', chargeRouter);
// router.get('/bankcodes', getBankCodes);
// router.use('/crypto', cryptoRoute);
router.use('/giftcard', giftcardRoute);
router.use('/admin/giftcard', adminGiftCardRoute);
router.use('/authorisation', authorisationRoute);

// CRYPTO INFRA

router.use(authenticate);

router.use('/infra/admin', adminRoutes);
router.use('/infra/wallets', walletRoutes); // Add userAuth middleware here
router.use('/infra/trade', tradeRoutes); // Add userAuth middleware here
router.use('/infra/webhooks', webhookRoutes);
router.use('/infra/crypto', userCryptoRoute);

export default router;
