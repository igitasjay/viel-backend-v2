import { Router } from 'express';
import { upload } from '../config/multer';
import {
  addCurrency,
  updateRates,
  auditLedger,
} from '../controllers/admin.controller';

const router = Router();
router.post('/coins/add-new', upload.single('image'), addCurrency);
router.put('/rates', updateRates);
router.get('/ledger/audit', auditLedger);
export default router;
