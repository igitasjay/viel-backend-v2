import express from 'express'
import { buyGiftcardRoutes } from './buy-giftcard.route';
import { sellGiftcardRoutes } from './sell-giftcard.routes';
import { requireAuth } from '@/shared/middlewares';
const giftcardroutes = express.Router()

giftcardroutes.use(requireAuth)
giftcardroutes.use('/buy', buyGiftcardRoutes)
giftcardroutes.use('/sell', sellGiftcardRoutes)

export default giftcardroutes;