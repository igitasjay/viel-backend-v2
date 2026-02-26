import { Router } from 'express';
import * as p from '@/giftcard-infra/controllers/purchase.controller';

const router = Router();
router.post('/purchase', p.initiateGiftCardPurchase);

export default router;
