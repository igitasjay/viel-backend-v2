import { Router } from 'express';
import { upload } from '@/middlewares/upload';
import * as adminCtrl from '@/controllers/giftcard/admin.controller';

import * as sellAdminCtrl from '@/controllers/giftcard/admin-sell.controller';

const router = Router();

// --- Buy Flow Admin Routes ---
router.post('/create', upload.single('image'), adminCtrl.createGiftCard);
router.post('/countries', adminCtrl.createCountry);
router.put('/giftcards', adminCtrl.updateGiftCard);

// --- Sell Flow Admin Routes ---
router.post('/sell/brands', upload.single('logo'), sellAdminCtrl.addBrand);
router.get('/sell/brands', sellAdminCtrl.listBrands);
router.post('/sell/brands/countries', sellAdminCtrl.addCountry);
router.post('/sell/brands/countries/ranges', sellAdminCtrl.addRange);
router.post('/sell/brands/countries/ranges/types', sellAdminCtrl.addType);
router.get('/sell/requests', sellAdminCtrl.listSales);
router.patch('/sell/requests', sellAdminCtrl.updateSale);

export default router;
