import { Request, Response } from 'express';
import User from '@/models/user.model';
import Transaction from '@/models/transaction.model';
import { asyncHandler } from '@/utils/async-handler.util';
import mongoose from 'mongoose';

// 1. Updating a user's password
export const updateUserPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const { password } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or missing user ID' });
    }

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: 'Password is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    user.password = password;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  },
);

// 2. Suspending a user's account
export const suspendUserAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.query.userId as string;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or missing user ID' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus: 'suspended' },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Account suspended successfully',
      data: user,
    });
  },
);

// Activation (Bonus/Helper)
export const activateUserAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.query.userId as string;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or missing user ID' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus: 'active' },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Account activated successfully',
      data: user,
    });
  },
);

// 3. Deleting a user (Soft delete)
export const deleteUserAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.query.userId as string;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or missing user ID' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus: 'deleted' },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Account marked as deleted successfully',
    });
  },
);

// 4. Fetching all users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  // Optionally filter out deleted users unless requested
  const includeDeleted = req.query.includeDeleted === 'true';
  const filter: any = includeDeleted
    ? {}
    : { accountStatus: { $ne: 'deleted' } };
  filter.role = { $ne: 'admin' };

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    data: users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

// 5. Fetching a user's transaction history
export const getUserTransactionHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or missing user ID' });
    }

    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  },
);
