import { Router } from 'express';
import { getBankTransferDetails, initBankTransfer, queryTransactionStatus } from '@/controllers/monnify.controller';

const router = Router();

/**
 * @route GET /api/v1/monnify/transfer-details/:reference
 * @desc Fetch bank transfer details from Monnify
 * @access Public
 */
router.get('/transfer-details/:reference', getBankTransferDetails);

/**
 * @route GET /api/v1/monnify/status/:reference
 * @desc Query transaction status (supports ?type=payment or ?type=transaction)
 * @access Public
 */
router.get('/status/:reference', queryTransactionStatus);

/**
 * @route POST /api/v1/monnify/init-bank-transfer
 * @desc Initialize a bank transfer and get dynamic account details
 * @access Public
 */
router.post('/init-bank-transfer', initBankTransfer);

export default router;
