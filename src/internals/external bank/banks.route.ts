// @/routes/v1/user.ts
import Router from 'express';
import { body } from 'express-validator';
import validationError from '@/middlewares/validation-error.middleware';
import getBanks, { resolveBankAccount } from '@/services/banks.service';
import { addBankAccount, updateBankAccount } from '@/internals/external bank/bank.controller';
import getCurrentUserBank from '@/internals/external bank/my-bank.controller';
import { requireAuth } from '@/shared/middlewares';

const bankingroutes = Router();

bankingroutes.use(requireAuth);

// Public endpoint to get bank list (or protect if preferred)
bankingroutes.get('/list', getBanks);

bankingroutes.get('/resolve', resolveBankAccount);

// Protected endpoint to add bank account
bankingroutes.post(
  '/add',
  body('accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Account number is required')
    .isLength({ min: 10 }),
  body('accountName').trim().notEmpty().withMessage('Account name is required'),
  body('bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('bankCode').trim().notEmpty().withMessage('Bank code is required'),
  validationError,
  addBankAccount,
);

bankingroutes.put('/update', updateBankAccount);

bankingroutes.get('/my-bank', getCurrentUserBank);

// router.post(
//   '/verify',
//   verifyBankValidation,
//   validationError,
//   verifyBankDetails,
// );

export default bankingroutes;
