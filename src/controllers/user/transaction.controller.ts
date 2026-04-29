import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler.util';
import { Ledger } from '@/crypto-infra/models/ledger.model';
import mongoose from 'mongoose';

export const getTransactionHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { category, type, page = 1, limit = 10 } = req.query;

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
      account: `USER:${userId}`,
    };

    if (category) {
      query.transactionCategory = category;
    }

    if (type) {
      query.transactionType = type;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const transactions = await Ledger.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Ledger.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  },
);
