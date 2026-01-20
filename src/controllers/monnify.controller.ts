import { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { getMonnifyTransactionDetails, initMonnifyBankTransfer, getMonnifyTransactionStatus } from '@/services/monnify.service';
import { logger } from '@/lib/winston';

export const getBankTransferDetails = [
  param('reference').trim().notEmpty().withMessage('Transaction reference is required'),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ code: 'ValidationError', errors: errors.array() });
      return;
    }

    const { reference } = req.params;

    try {
      const details = await getMonnifyTransactionDetails(reference);
      
      res.status(200).json({
        message: 'Bank transfer details fetched successfully',
        data: details,
      });
    } catch (error: any) {
      logger.error('Failed to fetch Monnify bank transfer details:', error);
      
      const statusCode = error.status || 500;
      const message = error.message || 'An internal server error occurred';
      const monnifyResponse = error.monnifyResponse || null;

      res.status(statusCode).json({
        code: 'MonnifyError',
        message: message,
        details: monnifyResponse,
      });
    }
  },
];

export const initBankTransfer = [
  body('transactionReference').trim().notEmpty().withMessage('Transaction reference is required'),
  body('bankCode').trim().notEmpty().withMessage('Bank code is required'),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ code: 'ValidationError', errors: errors.array() });
      return;
    }

    const { transactionReference, bankCode } = req.body;

    try {
      const details = await initMonnifyBankTransfer({ transactionReference, bankCode });
      
      res.status(200).json({
        message: 'Bank transfer initialized successfully',
        data: details,
      });
    } catch (error: any) {
      logger.error('Failed to initialize Monnify bank transfer:', error);
      
      const statusCode = error.status || 500;
      const message = error.message || 'An internal server error occurred';
      const monnifyResponse = error.monnifyResponse || null;

      res.status(statusCode).json({
        code: 'MonnifyError',
        message: message,
        details: monnifyResponse,
      });
    }
  },
];

export const queryTransactionStatus = [
  param('reference').trim().notEmpty().withMessage('Reference is required'),
  query('type')
    .optional()
    .isIn(['transaction', 'payment'])
    .withMessage('Type must be either transaction or payment'),
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ code: 'ValidationError', errors: errors.array() });
      return;
    }

    const { reference } = req.params;
    const { type } = req.query;
    const isPaymentReference = type === 'payment';

    try {
      const details = await getMonnifyTransactionStatus(reference, isPaymentReference);
      
      res.status(200).json({
        message: 'Transaction status fetched successfully',
        data: details,
      });
    } catch (error: any) {
      logger.error('Failed to query Monnify transaction status:', error);
      
      const statusCode = error.status || 500;
      const message = error.message || 'An internal server error occurred';
      const monnifyResponse = error.monnifyResponse || null;

      res.status(statusCode).json({
        code: 'MonnifyError',
        message: message,
        details: monnifyResponse,
      });
    }
  },
];
