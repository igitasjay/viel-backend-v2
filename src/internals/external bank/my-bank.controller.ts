// src/controllers/bank/getCurrentUserBank.ts
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';
import { prisma } from '@shared/db/prisma';

const getCurrentUserBank = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = (req.currentUser?.id || req.userId) as unknown as string; // set by `requireAuth` or `authenticate` middleware

  try {
    // Verify user exists (optional – defensive)
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

    // Find the linked bank account (one-to-one)
    const bankAccount = await prisma.externalAccount.findFirst({
      where: { userId },
    });

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
        id: bankAccount.id,
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        monnifyBankCode: bankAccount.monnifyBankCode,
        obiexBankCode: bankAccount.obiexBankCode,
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
