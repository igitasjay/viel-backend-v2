import { Router } from 'express';
import { upload } from '@/middlewares/upload';
import * as adminCtrl from '@/controllers/giftcard/admin.controller';

const router = Router();

router.post('/create', upload.single('image'), adminCtrl.createGiftCard);
router.post('/countries', adminCtrl.createCountry);
// router.post('/giftcards', adminCtrl.createGiftCard);
router.put('/giftcards/:id', adminCtrl.updateGiftCard);

export default router;
