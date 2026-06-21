import { Router } from 'express';
import authenticate from '@/middlewares/authenticate.middleware';
import restrictSuspended from '@/middlewares/restrict-suspended.middleware';
import verifyUser from '@/middlewares/verify-user.middleware';
import { upload } from '@/middlewares/upload';

import * as buyController from '../controllers/buy.controller';
import * as sellController from '../controllers/sell.controller';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// --- BUY FLOW ---
router.get('/countries', buyController.getCountries);
router.get('/products', buyController.getProducts);
router.get('/products/:id/exchange-rate', buyController.getExchangeRate);
router.post('/orders/place', authenticate, restrictSuspended, verifyUser, buyController.placeOrder);
router.post('/orders/fulfill', buyController.fulfillOrder); // Typically called by Monnify webhook or internal sync
router.post('/orders/:id/refresh-codes', authenticate, restrictSuspended, buyController.refreshCodes);

// --- SELL FLOW ---
router.get('/accepted-cards', sellController.getAcceptedCards);
router.post('/calculate-payout', sellController.calculatePayout);
router.post('/submit', authenticate, restrictSuspended, upload.array('images', 10), sellController.submitSale);

// --- ADMIN FLOW ---
// Ensure you have an isAdmin middleware or similar to protect this endpoint.
// For now, using authenticate as placeholder, but you should add your admin guard.
router.post('/admin/sales/:saleId/approve', authenticate, adminController.approveSale);
router.post('/admin/sync-products', authenticate, adminController.syncProducts);

export default router;
