import { Router } from 'express';
import { upload } from '@/middlewares/upload';
import * as adminCtrl from '@/giftcard-infra/controllers/admin.controller';

import * as sellAdminCtrl from '@/giftcard-infra/controllers/sell.controller.admin';
import * as purchaseAdminCtrl from '@/giftcard-infra/controllers/purchase.controller.admin';

const router = Router();

// --- Buy Flow Admin Routes ---
router.post('/create', upload.single('image'), adminCtrl.createGiftCard);
router.post('/countries', adminCtrl.createCountry);
router.put('/giftcards', adminCtrl.updateGiftCard);
router.get('/giftcards/purchases', purchaseAdminCtrl.listGiftCardPurchases);
router.post('/giftcards/purchases/approve', purchaseAdminCtrl.approveGiftCardPurchase);
router.post('/giftcards/purchases/decline', purchaseAdminCtrl.declineGiftCardPurchase);

// --- Sell Flow Admin Routes ---
router.post('/sell/brands', upload.single('logo'), sellAdminCtrl.addBrand);
router.get('/sell/brands', sellAdminCtrl.listBrands);
router.post('/sell/brands/countries', sellAdminCtrl.addCountry);
router.post('/sell/brands/countries/ranges', sellAdminCtrl.addRange);
router.post('/sell/brands/countries/ranges/types', sellAdminCtrl.addType);
router.get('/sell/requests', sellAdminCtrl.listSales);
router.post('/sell/requests/approve', sellAdminCtrl.approveSale);
router.patch('/sell/requests', sellAdminCtrl.updateSale);

export default router;
