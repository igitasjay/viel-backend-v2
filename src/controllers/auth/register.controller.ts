import config from '@/config/config';
import User from '@/models/user.model';
import { IUser } from '@/models/user.model';
import { logger } from '@/lib/winston';
import { Request, Response } from 'express';
import OTP from '@/models/otp.mode';
import Referral from '@/models/referral.model';
import { sendVerificationEmail } from '@/lib/email';

type UserData = Pick<
  IUser,
  'firstname' | 'lastname' | 'email' | 'password' | 'role'
>;

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req: Request, res: Response): Promise<void> => {
  const { firstname, lastname, email, password, role, referredBy } = req.body;

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
      referredBy: referredBy || '',
    });

    if (referredBy) {
      const referrer = await User.findOne({ myReferralCode: referredBy }).exec();
      if (referrer) {
        await Referral.create({
          referrerId: referrer._id,
          referredUserId: newUser._id,
          status: 'pending_eligibility',
        });
        logger.info(`Referral link created: User ${newUser._id} referred by ${referrer._id}`);
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await OTP.create({
      userId: newUser._id,
      email: newUser.email,
      otp,
      expiresAt,
    });

    try {
      await sendVerificationEmail(newUser.email, newUser.firstname, otp);
    } catch (emailError) {
      logger.warn('Failed to send verification email', {
        email: newUser.email,
        error: emailError,
      });
      // Do not throw — registration succeeds, user must retry OTP or resend later
    }

    res.status(201).json({
      success: true,
      message: 'User registered. Please verify your email with the OTP sent.',
      title: {
        email: newUser.email,
        otp: otp,
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
