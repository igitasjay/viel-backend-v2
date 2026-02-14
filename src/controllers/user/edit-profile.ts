import User from '@/models/user.model';
import type { Request, Response } from 'express';
import { logger } from '@/lib/winston';

/**
 * Edit user profile (firstname and lastname)
 * Only allowed for unverified users.
 */
const editProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId;
  const { firstname, lastname } = req.body;

  if (!firstname || !lastname) {
    res.status(400).json({
      code: 'BadRequest',
      message: 'Firstname and lastname are required.',
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

    if (user.verifiedUser) {
      res.status(403).json({
        code: 'Forbidden',
        message: 'Verified users cannot update their profile names.',
      });
      return;
    }

    user.firstname = firstname;
    user.lastname = lastname;

    await user.save();

    logger.info(`User ${userId} updated their profile names.`, {
      firstname,
      lastname,
    });

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        verifiedUser: user.verifiedUser,
      },
    });
  } catch (error) {
    logger.error('Error updating user profile.', {
      userId,
      error,
    });
    res.status(500).json({
      code: 'ServerError',
      message: 'An internal server error occurred while updating the profile.',
    });
  }
};

export default editProfile;
