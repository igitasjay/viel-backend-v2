import User from '@/models/user.model';
import BankAccount from '@/models/bank.model';
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';
import { Types } from 'mongoose';
import crypto from 'crypto';

const generateReferralCode = async (): Promise<string> => {
  let referralCode: string;
  let codeExists: boolean;
  do {
    referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    codeExists = (await User.exists({ myReferralCode: referralCode })) !== null;
  } while (codeExists);
  return referralCode;
};

const addBankAccount = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;
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
    const user = await User.findById(userId).exec();
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found.',
      });
      return;
    }

    if (!user.verifiedUser) {
      res.status(403).json({
        code: 'VerificationRequired',
        message: 'You must be a verified user to add a bank account.',
      });
      return;
    }

    const existingBank = await BankAccount.findOne({ userId }).exec();
    if (existingBank) {
      res.status(400).json({
        code: 'DuplicateError',
        message: 'You already have a bank account linked.',
      });
      return;
    }

    const bankAccount = await BankAccount.create({
      userId: new Types.ObjectId(userId),
      accountNumber,
      accountName,
      bankName,
      bankCode,
    });

    // Generate referral code if user doesn't have one
    if (!user.myReferralCode) {
      user.myReferralCode = await generateReferralCode();
      await user.save();
      logger.info(`Generated referral code ${user.myReferralCode} for user ${userId}`);
    }

    logger.info('User bank account added successfully', { userId });

    res.status(201).json({
      message: 'Bank account added successfully.',
      bankAccount,
      myReferralCode: user.myReferralCode,
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
  const userId = req.userId;
  const { accountNumber, accountName, bankName, bankCode } = req.body;

  try {
    const bankAccount = await BankAccount.findOne({ userId }).exec();
    if (!bankAccount) {
      res.status(404).json({
        code: 'NotFound',
        message: 'Bank account not found.',
      });
      return;
    }

    if (accountNumber) bankAccount.accountNumber = accountNumber;
    if (accountName) bankAccount.accountName = accountName;
    if (bankName) bankAccount.bankName = bankName;
    if (bankCode) bankAccount.bankCode = bankCode;

    await bankAccount.save();
    logger.info('User bank account updated', { userId });

    res.status(200).json({
      message: 'Bank account updated successfully.',
      bankAccount,
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
