import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';
import crypto from 'crypto';
import { prisma } from '@shared/db/prisma';
import { resolveObiexBankCode } from '@/services/obiex-bank-resolver.service';

const generateReferralCode = async (): Promise<string> => {
  let referralCode: string;
  let codeExists: boolean;
  do {
    referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const existing = await prisma.user.findUnique({
      where: { referralCode },
    });
    codeExists = !!existing;
  } while (codeExists);
  return referralCode;
};

const addBankAccount = async (req: Request, res: Response): Promise<void> => {
  const userId = (req.currentUser?.id || req.userId) as unknown as string;
  const { accountNumber, accountName, bankName, bankCode } = req.body;

  if (!accountNumber || !accountName || !bankName || !bankCode) {
    res.status(400).json({
      code: 'ValidationError',
      message:
        'All bank details (accountNumber, accountName, bankName, bankCode) are required.',
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found.',
      });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        code: 'VerificationRequired',
        message: 'You must be a verified user to add a bank account.',
      });
      return;
    }

    const existingBank = await prisma.externalAccount.findFirst({
      where: { userId },
    });

    if (existingBank) {
      res.status(400).json({
        code: 'DuplicateError',
        message: 'You already have a bank account linked.',
      });
      return;
    }

    const obiexBankCode = await resolveObiexBankCode(bankName, bankCode);

    const externalAccount = await prisma.externalAccount.create({
      data: {
        userId,
        accountNumber,
        accountName,
        bankName,
        monnifyBankCode: bankCode,
        obiexBankCode,
        isPrimary: true,
      },
    });

    // Generate referral code if user doesn't have one
    let myReferralCode = user.referralCode;
    if (!myReferralCode) {
      myReferralCode = await generateReferralCode();
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: myReferralCode },
      });
      logger.info(`Generated referral code ${myReferralCode} for user ${userId}`);
    }

    logger.info('User bank account added successfully', { userId });

    res.status(201).json({
      message: 'Bank account added successfully.',
      bankAccount: externalAccount,
      myReferralCode,
    });
  } catch (error) {
    logger.error('Error adding bank account', { userId, error });
    res.status(500).json({
      code: 'ServerError',
      message: 'An internal server error occurred.',
    });
  }
};

const updateBankAccount = async (req: Request, res: Response): Promise<void> => {
  const userId = (req.currentUser?.id || req.userId) as unknown as string;
  const { accountNumber, accountName, bankName, bankCode } = req.body;

  try {
    const externalAccount = await prisma.externalAccount.findFirst({
      where: { userId },
    });

    if (!externalAccount) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Bank account not found.',
      });
      return;
    }

    let newObiexBankCode = externalAccount.obiexBankCode;
    if (bankName || bankCode) {
      newObiexBankCode = await resolveObiexBankCode(
        bankName || externalAccount.bankName, 
        bankCode || externalAccount.monnifyBankCode!
      ) || newObiexBankCode;
    }

    const updatedAccount = await prisma.externalAccount.update({
      where: { id: externalAccount.id },
      data: {
        accountNumber: accountNumber || externalAccount.accountNumber,
        accountName: accountName || externalAccount.accountName,
        bankName: bankName || externalAccount.bankName,
        monnifyBankCode: bankCode || externalAccount.monnifyBankCode,
        obiexBankCode: newObiexBankCode,
      },
    });

    logger.info('User bank account updated', { userId });

    res.status(200).json({
      message: 'Bank account updated successfully.',
      bankAccount: updatedAccount,
    });
  } catch (error) {
    logger.error('Error updating bank account', { userId, error });
    res.status(500).json({
      code: 'ServerError',
      message: 'An internal server error occurred.',
    });
  }
};

export { addBankAccount, updateBankAccount };
