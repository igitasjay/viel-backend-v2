import User from '@/models/user.model';
import { logger } from '@/lib/winston';
import { Request, Response } from 'express';

const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('-__v').lean().exec();

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({
      code: 'ServerError',
      message: 'An internal server error occurred during authorization.',
    });
    logger.error('Error during authorization middleware.', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error,
    });
  }
};

export default getCurrentUser;
