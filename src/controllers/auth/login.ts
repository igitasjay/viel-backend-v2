import config from '@/config';
import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import User from '@/models/user';
import { IUser } from '@/models/user';
import Token from '@/models/token';
import { logger } from '@/lib/winston';

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as Pick<IUser, 'email' | 'password'>;
    const user = await User.findOne({ email })
      .select('firstname lastname email phone password role')
      .lean()
      .exec();
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found',
      });
      return;
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await Token.create({
      userId: user._id,
      token: refreshToken,
    });
    logger.info('Refresh token stored in database', {
      userId: user._id,
      token: refreshToken,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(201).json({
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
    });
    logger.info('New user logged in...', user);
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    logger.error('Error registering user', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error,
    });
  }
};

export default login;
