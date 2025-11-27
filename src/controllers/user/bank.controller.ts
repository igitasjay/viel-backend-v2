import User from '@/models/user.model';
import BankAccount from '@/models/bank.model';
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';
import { Types } from 'mongoose';

const addBankAccount = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId; // Assumes this is set by your authenticate middleware
  console.log('user id hererererere:::', userId);
  const { accountNumber, accountName, bankName, bankCode } = req.body;

  // Basic validation (expand with express-validator in route if needed)
  if (!accountNumber || !accountName || !bankName || !bankCode) {
    res.status(400).json({
      code: 'ValidationError',
      message:
        'All bank details (accountNumber, accountName, bankName, bankCode) are required.',
    });
    return;
  }

  try {
    // Verify user exists
    const user = await User.findById(userId).exec();
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found.',
      });
      return;
    }

    // Check if user already has a bank account
    const existingBank = await BankAccount.findOne({ userId }).exec();
    if (existingBank) {
      res.status(400).json({
        code: 'DuplicateError',
        message:
          'You already have a bank account linked. Contact support to update.',
      });
      return;
    }

    // Create new bank account
    const bankAccount = await BankAccount.create({
      userId: new Types.ObjectId(userId),
      accountNumber,
      accountName,
      bankName,
      bankCode,
    });

    // Optionally populate user with bank details if needed in future responses
    await user.populate({
      path: 'bankAccount',
      match: { userId: user._id },
      select: '-__v',
    });

    logger.info('User bank account added successfully', {
      userId,
      bankId: bankAccount._id,
    });

    res.status(201).json({
      message: 'Bank account added successfully.',
      bankAccount: {
        id: bankAccount._id,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        bankCode: bankAccount.bankCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 'ServerError',
      message: 'An internal server error occurred while adding bank account.',
    });
    logger.error('Error adding bank account', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId,
      error,
    });
  }
};

export default addBankAccount;
