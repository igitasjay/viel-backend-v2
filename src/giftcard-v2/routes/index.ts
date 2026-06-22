import { Router } from 'express';
import authenticate from '@/middlewares/authenticate.middleware';
import restrictSuspended from '@/middlewares/restrict-suspended.middleware';
import verifyUser from '@/middlewares/verify-user.middleware';
import { upload } from '@/middlewares/upload';

import * as BuyController from '../controllers/buy.controller';
import * as SellController from '../controllers/sell.controller';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

// --- BUY FLOW ---
router.get('/countries', BuyController.getCountries);
router.get('/products/:countryCode', BuyController.getCountryProducts);
router.get('/products/:id/exchange-rate', BuyController.getExchangeRate);
router.post('/orders/place', authenticate, restrictSuspended, verifyUser, BuyController.placeOrder);
router.post('/orders/fulfill', BuyController.fulfillOrder); // Typically called by Monnify webhook or internal sync
router.post('/orders/:id/refresh-codes', authenticate, restrictSuspended, BuyController.refreshCodes);

// --- SELL FLOW ---
router.get('/accepted-cards', SellController.getAcceptedCards);
router.post('/calculate-payout', SellController.calculatePayout);
router.post('/submit', authenticate, restrictSuspended, upload.array('images', 10), SellController.submitSale);

// --- ADMIN FLOW ---
// Ensure you have an isAdmin middleware or similar to protect this endpoint.
// For now, using authenticate as placeholder, but you should add your admin guard.
router.post('/admin/sales/:saleId/approve', authenticate, AdminController.approveSale);
router.post('/admin/sync-products', authenticate, AdminController.syncProducts);

export default router;
