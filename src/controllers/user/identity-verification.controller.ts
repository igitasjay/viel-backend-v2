import User from '@/models/user.model';
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';

/**
 * Manually set a user as verified (to be called by third-party webhook or admin)
 * For now, making it a simple endpoint for the frontend to call after success.
 */
const verifyIdentity = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).exec();
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found.',
      });
      return;
    }

    user.verifiedUser = true;
    await user.save();

    logger.info(`User ${userId} identity verified.`);

    res.status(200).json({
      message: 'Identity verified successfully.',
      verifiedUser: user.verifiedUser,
    });
  } catch (error) {
    logger.error('Error verifying identity', { userId, error });
    res.status(500).json({
      code: 'ServerError',
      message: 'An internal server error occurred while verifying identity.',
    });
  }
};

export default verifyIdentity;
