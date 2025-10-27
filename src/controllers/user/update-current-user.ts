import User from '@/models/user';
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';
import { Types } from 'mongoose';

const updateCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.userId;
  const { firstname, lastname, email, phone, password } = req.body;
  try {
    const user = await User.findById(userId).select('+password -__v').exec();
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found.',
      });
      return;
    }
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.password = password;

    await user.save();
    logger.info('User updated their profile.', user);

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

export default updateCurrentUser;
