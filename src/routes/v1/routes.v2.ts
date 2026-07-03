
import giftcardroutes from '@/internals/giftcard/routes';
import { giftcardRoutes as adminGiftcardRoutes } from '@/admins/routes/giftcard.route.admin';
import express from 'express'
import { authRoutes } from '@/internals/authentication/auth.route';
import { handleMonnifyWebhook } from '@/controllers/monnify.webhook';
const v2router = express.Router()

v2router.use('/auth', authRoutes)
v2router.use('/giftcards', giftcardroutes);
v2router.use('/admin/giftcards', adminGiftcardRoutes)
v2router.post('/monnify/webhook', handleMonnifyWebhook);

export default v2router