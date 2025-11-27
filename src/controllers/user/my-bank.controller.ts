// src/controllers/bank/getCurrentUserBank.ts
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';
import BankAccount from '@/models/bank.model';
import User from '@/models/user.model';

const getCurrentUserBank = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.userId!; // set by `authenticate` middleware

  try {
    // Verify user exists (optional – defensive)
    const user = await User.findById(userId).lean().exec();
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found.',
      });
      return;
    }

    // Find the linked bank account (one-to-one)
    const bankAccount = await BankAccount.findOne({ userId })
      .select('-__v -createdAt -updatedAt')
      .lean()
      .exec();

    if (!bankAccount) {
      res.status(404).json({
        code: 'NotFound',
        message: 'No bank account linked to this user.',
      });
      return;
    }

    logger.info('User bank details fetched', { userId });

    res.status(200).json({
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
      message: 'An internal server error occurred while fetching bank details.',
    });
    logger.error('Error fetching user bank details', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId,
      error,
    });
  }
};

export default getCurrentUserBank;
