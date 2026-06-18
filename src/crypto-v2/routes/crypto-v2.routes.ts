import { Router } from 'express';
import { CryptoBuyController } from '../controllers/crypto-buy.controller';
import { CryptoSellController } from '../controllers/crypto-sell.controller';
import { ObiexWebhookController } from '../controllers/obiex-webhook.controller';
import { requireIdempotencyKey } from '../middlewares/idempotency.middleware';
import { verifyObiexWebhook } from '../middlewares/obiex-webhook.middleware';
import authenticate from '@/middlewares/authenticate.middleware';

const router = Router();

// ==========================================
// Buy Crypto Routes
// ==========================================
router.post('/buy/quote', authenticate, CryptoBuyController.getQuote);
router.post('/buy/execute', authenticate, requireIdempotencyKey, CryptoBuyController.executeBuy);
router.post('/buy/whitelist', authenticate, CryptoBuyController.addWhitelist);
router.get('/buy/whitelist', authenticate, CryptoBuyController.getWhitelist);

// ==========================================
// Sell Crypto Routes
// ==========================================
router.post('/sell/generate-wallet', authenticate, CryptoSellController.generateWallet);
router.get('/sell/wallets', authenticate, CryptoSellController.getWallets);

// ==========================================
// Webhook Routes (No Auth Middleware)
// ==========================================
router.post('/webhook/obiex', verifyObiexWebhook, ObiexWebhookController.handleWebhook);

export default router;
