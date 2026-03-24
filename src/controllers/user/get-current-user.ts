import User from '@/models/user.model';
import { logger } from '@/lib/winston';
import { Request, Response } from 'express';

const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('-__v +passcode').lean().exec();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const userObj = {
      ...user,
      hasPasscode: !!user.passcode,
    };
    delete (userObj as any).passcode;

    res.status(200).json({ user: userObj });
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
