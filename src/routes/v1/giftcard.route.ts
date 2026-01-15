import { Router } from 'express';
import * as gc from '@/controllers/giftcard/giftcard.controller';

import authenticate from '@/middlewares/authenticate.middleware';
import * as sellGc from '@/controllers/giftcard/giftcard-sell.controller';
import { upload } from '@/middlewares/upload';

const router = Router();

// --- Buy Flow ---
router.get('/countries', gc.listCountries);
router.get('/giftcards', gc.listGiftCardsByCountry);
router.post('/buy', authenticate, gc.buyGiftCard);

// --- Sell Flow ---
router.get('/sell/brands', sellGc.getSellBrands);
router.get('/sell/categories', sellGc.getSellCategories);
router.post('/sell', authenticate, upload.array('images', 10), sellGc.sellGiftCard);

export default router;
