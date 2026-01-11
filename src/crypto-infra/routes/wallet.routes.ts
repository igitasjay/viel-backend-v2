import { Router } from 'express';
import {
  getBalances,
  generateAddress,
  withdrawCrypto,
  getUserWallets,
} from '../controllers/wallet.controller';

const router = Router();
// Assume verifyToken middleware is injected in main app
router.get('/', getBalances);
router.get('/addresses', getUserWallets);
router.post('/generate', generateAddress);
router.post('/withdraw', withdrawCrypto);
export default router;
