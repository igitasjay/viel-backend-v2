import { Router } from 'express';
import {
  getBalances,
  generateAddress,
  withdrawCrypto,
} from '../controllers/wallet.controller';

const router = Router();
// Assume verifyToken middleware is injected in main app
router.get('/', getBalances);
router.post('/generate', generateAddress);
router.post('/withdraw', withdrawCrypto);
export default router;
