import { Router } from 'express';
import * as gc from '@/controllers/giftcard/giftcard.controller';

const router = Router();
router.get('/countries', gc.listCountries);
router.get('/countries/:countryId/giftcards', gc.listGiftCardsByCountry);

export default router;
