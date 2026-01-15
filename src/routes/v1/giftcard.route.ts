import { Router } from 'express';
import * as gc from '@/controllers/giftcard/giftcard.controller';

import authenticate from '@/middlewares/authenticate.middleware';

const router = Router();
router.get('/countries', gc.listCountries);
router.get('/giftcards', gc.listGiftCardsByCountry);
router.post('/buy', authenticate, gc.buyGiftCard);

export default router;
