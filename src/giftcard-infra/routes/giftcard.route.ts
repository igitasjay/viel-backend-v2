import { Router } from 'express';
import * as gc from '@/giftcard-infra/controllers/giftcard.controller';

import authenticate from '@/middlewares/authenticate.middleware';
import * as sellGc from '@/giftcard-infra/controllers/giftcard-sell.controller';
import { upload } from '@/middlewares/upload';
import restrictSuspended from '@/middlewares/restrict-suspended.middleware';
import verifyUser from '@/middlewares/verify-user.middleware';

import { initiateGiftCardPurchase } from '@/giftcard-infra/controllers/purchase.controller';

const router = Router();

// --- Buy Flow ---
router.get('/countries', gc.listCountries);
router.get('/giftcards', gc.listGiftCardsByCountry);
router.post('/buy', authenticate, restrictSuspended, verifyUser, initiateGiftCardPurchase);

// --- Sell Flow ---
router.get('/sell/brands', sellGc.getSellBrands);
router.post('/sell', authenticate, restrictSuspended, upload.array('images', 10), sellGc.sellGiftCard);

export default router;
