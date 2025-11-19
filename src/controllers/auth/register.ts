import config from '@/config';
import User from '@/models/user';
import { IUser } from '@/models/user';
import { logger } from '@/lib/winston';
import { Request, Response } from 'express';
import OTP from '@/models/otp';
import { sendEmail } from '@/lib/email';

type UserData = Pick<
  IUser,
  'firstname' | 'lastname' | 'email' | 'password' | 'role'
>;

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req: Request, res: Response): Promise<void> => {
  const { firstname, lastname, email, password, role } = req.body as UserData;

  if (role === 'admin' && !config.WHITELIST_ADMINS_EMAIL.includes(email)) {
    res.status(403).json({
      code: 'AuthorizationError',
      message: 'Forbidden: You are not allowed to register as admin',
    });
    logger.warn(
      `User with email ${email} tried to register as admin but is not on the whitelist.`,
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email,
      },
    );
    return;
  }

  try {
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password,
      role,
      isEmailVerified: false,
      verifiedUser: false,
      netTradingVolumn: 0,
      passcode: '',
      nin: '',
      bvn: '',
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({
      userId: newUser._id,
      email: newUser.email,
      otp,
      expiresAt,
    });

    await sendEmail(
      newUser.email,
      'Email Verification OTP',
      `Your OTP for email verification is: ${otp}. It expires in 10 minutes.`,
    );

    res.status(201).json({
      message: 'User registered. Please verify your email with the OTP sent.',
      user: {
        email: newUser.email,
      },
    });
    logger.info('New user registered, OTP sent', {
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      role: newUser.role,
    });
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

export default register;
