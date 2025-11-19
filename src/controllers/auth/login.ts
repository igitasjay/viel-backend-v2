import config from '@/config';
import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import User from '@/models/user';
import { IUser } from '@/models/user';
import Token from '@/models/token';
import { logger } from '@/lib/winston';
import OTP from '@/models/otp';
import { sendEmail } from '@/lib/email';

type UserData = Pick<IUser, 'email' | 'password'>;

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as UserData;
    const user = await User.findOne({ email })
      .select('firstname lastname email phone password role isEmailVerified')
      .lean()
      .exec();
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found',
      });
      return;
    }

    if (!user.isEmailVerified) {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await OTP.create({
        userId: user._id,
        email: user.email,
        otp,
        expiresAt,
      });

      await sendEmail(
        user.email,
        'Email Verification OTP',
        `Your OTP for login is: ${otp}. It expires in 10 minutes.`,
      );

      res.status(200).json({
        message: 'Please verify your email with the OTP sent.',
        user: {
          email: user.email,
        },
      });
      logger.info('OTP sent for login verification', { email: user.email });
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

    res.status(200).json({
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
    });
    logger.info('User logged in', { email: user.email });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    logger.error('Error during login', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error,
    });
  }
};

export default login;
