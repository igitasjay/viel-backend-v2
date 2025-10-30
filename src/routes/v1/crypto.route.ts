// src/routes/v1/crypto.routes.ts
import { Router } from 'express';
import {
  getSupportedCoins,
  getDepositWallet,
} from '@/controllers/crypto/user.crypto.controller';
import {
  createCrypto,
  updateCrypto,
  deleteCrypto,
} from '@/controllers/crypto/admin.crypto.controller';
import authenticate from '@/middlewares/authenticate';
import { isAdmin } from '@/middlewares/role-check';
import { requestDepositAddress } from '@/controllers/crypto/deposit.controller';

const router = Router();

router.use(authenticate);

// Public
router.get('/coins', getSupportedCoins);
router.get('/wallet', getDepositWallet);
router.get('/request', requestDepositAddress);

// Admin Only
router.post('/admin', isAdmin, createCrypto);
router.put('/admin/:id', isAdmin, updateCrypto);
router.delete('/admin/:id', isAdmin, deleteCrypto);

export default router;
