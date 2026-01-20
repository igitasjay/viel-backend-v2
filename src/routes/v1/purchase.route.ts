import { Router } from 'express';
import * as p from '@/controllers/giftcard/purchase.controller';

const router = Router();
router.post('/purchase', p.initiateGiftCardPurchase);

export default router;
