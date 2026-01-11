import { Router } from 'express';
import {
  fetchAllCurrencies,
} from '../controllers/crypto.controller';

const router = Router();
router.get('/coins/all', fetchAllCurrencies);

export default router;
