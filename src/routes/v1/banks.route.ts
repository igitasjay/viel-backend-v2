// @/routes/v1/user.ts
import Router from 'express';
import { body } from 'express-validator';
import validationError from '@/middlewares/validation-error.middleware';
import authenticate from '@/middlewares/authenticate.middleware';
import getBanks, { resolveBankAccount } from '@/services/banks.service';
import { addBankAccount, updateBankAccount } from '@/controllers/user/bank.controller';
import getCurrentUserBank from '@/controllers/user/my-bank.controller';

const router = Router();

router.use(authenticate);

// Public endpoint to get bank list (or protect if preferred)
router.get('/list', getBanks);

router.get('/resolve', resolveBankAccount);

// Protected endpoint to add bank account
router.post(
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

router.put('/update', updateBankAccount);

router.get('/my-bank', getCurrentUserBank);

// router.post(
//   '/verify',
//   verifyBankValidation,
//   validationError,
//   verifyBankDetails,
// );

export default router;
