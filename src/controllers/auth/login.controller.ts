import config from '@/config/config';
import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import User from '@/models/user.model';
import { IUser } from '@/models/user.model';
import Token from '@/models/token.model';
import { logger } from '@/lib/winston';
import OTP from '@/models/otp.mode';
import { sendVerificationEmail } from '@/lib/email';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

type UserData = Pick<IUser, 'email' | 'password'>;

const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as UserData;
    const user = await User.findOne({ email })
      .select('firstname lastname email phone password role isEmailVerified accountStatus')
      .lean()
      .exec();
    if (!user) {
      res.status(401).json({
        code: 'INVLIDCREDENTIALS',
        message: 'Invalid credentials',
      });
      return;
    }

    if (user.accountStatus === 'deleted') {
      res.status(403).json({
        code: 'AccountDeletedError',
        message: 'Your account has been deleted.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      logger.warn('Failed login attempt: Incorrect password', { email });
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

      try {
        await sendVerificationEmail(user.email, user.firstname, otp);
      } catch (emailError) {
        logger.warn('Failed to send verification email', {
          email: user.email,
          error: emailError,
        });
      }

      res.status(401).json({
        success: false,
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
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.myReferralCode,
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
