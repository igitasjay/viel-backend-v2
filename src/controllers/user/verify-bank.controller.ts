// src/controllers/bank/verify-bank.ts
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { verifyBankAccount } from '@/services/paystack';
import { logger } from '@/lib/winston';

export const verifyBankDetails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      code: 'ValidationError',
      message: 'Invalid input',
      details: errors.array(),
    });
    return;
  }

  const { accountNumber, bankCode } = req.body;

  try {
    const result = await verifyBankAccount(accountNumber, bankCode);

    if (!result.status || !result.data?.account_name) {
      res.status(400).json({
        code: 'VerificationFailed',
        message: result.message || 'Unable to verify account details',
      });
      return;
    }

    logger.info('Bank account verified successfully', {
      accountNumber,
      bankCode,
      accountName: result.data.account_name,
      ip: req.ip,
    });

    res.status(200).json({
      message: 'Bank account verified',
      data: {
        accountNumber: result.data.account_number,
        accountName: result.data.account_name,
        bankName: result.data.bank_name,
        bankCode,
      },
    });
  } catch (error: any) {
    res.status(502).json({
      code: 'ExternalServiceError',
      message: 'Failed to contact bank verification service',
    });
  }
};

// Validation chain
export const verifyBankValidation = [
  body('accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Account number is required')
    .isLength({ min: 10, max: 10 })
    .withMessage('Account number must be 10 digits')
    .isNumeric()
    .withMessage('Account number must contain only digits'),

  body('bankCode')
    .trim()
    .notEmpty()
    .withMessage('Bank code is required')
    .isLength({ min: 3 })
    .withMessage('Bank code must be at least 3 digits')
    .isNumeric()
    .withMessage('Bank code must be numeric'),
];
