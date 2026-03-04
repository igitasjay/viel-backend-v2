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
// import tradeRoutes from '../../crypto-infra/routes/trade.routes';
import webhookRoutes from '../../crypto-infra/routes/webhook.routes';
import adminRoutes from '../../crypto-infra/routes/admin.routes';
import authenticate from '@/middlewares/authenticate.middleware';
import userCryptoRoute from '../../crypto-infra/routes/crypto.routes';
import giftcardRoute from '@/giftcard-infra/routes/giftcard.route';
import transactionRouter from '@/routes/v1/transaction.route';
import monnifyRoute from '@/monnify-infra/routes/monnify.route';
import { handleMonnifyWebhook } from '@/controllers/monnify.webhook';
import { verifyTransactionStatus } from '@/controllers/verification.controller';
import bannerRouter from '@/routes/v1/banner.routes';
import adminBannerRouter from '@/routes/v1/admin-banner.routes';
import adminUserRouter from '@/routes/v1/admin-user.routes';
import adminSettingRouter from '@/routes/v1/admin-setting.routes';
import healthRouter from '@/routes/v1/health.route';

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
router.use('/transactions', transactionRouter);
router.use('/monnify', monnifyRoute);
router.use('/banners', bannerRouter);
router.use('/admin/banners', adminBannerRouter);
router.use('/admin/users', adminUserRouter);
router.use('/admin/settings', adminSettingRouter);
router.use('/health', healthRouter);

router.post('/monnify/webhook', handleMonnifyWebhook);

router.use(authenticate);

router.post('/transactions/:reference/verify', verifyTransactionStatus);

// CRYPTO INFRA


router.use('/infra/admin', adminRoutes);
router.use('/infra/wallets', walletRoutes);  
// router.use('/infra/trade', tradeRoutes); 
router.use('/infra/webhooks', webhookRoutes);
router.use('/infra/crypto', userCryptoRoute);

export default router;
