
import { giftcardRoutes as userGiftcardRoutes } from '@/internals/giftcard/routes/buy-giftcard.route';
import { giftcardRoutes as adminGiftcardRoutes } from '@/admins/routes/giftcard.route.admin';
import express from 'express'
const v2router = express.Router()

v2router.use('/giftcards', userGiftcardRoutes);
v2router.use('/admin/giftcards', adminGiftcardRoutes)

export default v2router