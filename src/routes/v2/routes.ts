import giftcardroutes from '@/internals/giftcard/routes';
import express from 'express'
import { authRoutes } from '@/internals/authentication/auth.route';
import { handleMonnifyWebhook } from '@/controllers/monnify.webhook';
import monnifyRoutes from '@/monnify-infra/routes/monnify.route';
import { cryptoRoutes } from '@/internals/crypto';
import { historyRoutes } from '@/internals/histories';
import { accountRoutes } from '@/internals/accounts';
import { profileRoutes } from '@/internals/profile';
import { bannerRoutes } from '@/internals/banner';
import bankingroutes from '../../internals/external bank/banks.route';
import adminRouter from '@/admins/routes';
import { notificationRoutes } from '@/internals/notification';
const v2router = express.Router()

v2router.use('/auth', authRoutes)
v2router.use('/account', accountRoutes)
v2router.use('/profile', profileRoutes)
v2router.use('/banners', bannerRoutes);
v2router.use('/giftcards', giftcardroutes);
v2router.use('/bank', bankingroutes);
v2router.use('/crypto', cryptoRoutes)
v2router.use('/history', historyRoutes)
v2router.post('/monnify/webhook', handleMonnifyWebhook);
v2router.use('/monnify', monnifyRoutes);
v2router.use('/notifications', notificationRoutes);

v2router.use('/admin', adminRouter)

export default v2router