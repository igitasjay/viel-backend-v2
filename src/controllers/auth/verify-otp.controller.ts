import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import User from '@/models/user.model';
import Token from '@/models/token.model';
import { logger } from '@/lib/winston';
import OTP from '@/models/otp.mode';
import config from '@/config/config';
import crypto from 'crypto';

const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email })
      .select('firstname lastname email phone role isEmailVerified')
      .lean()
      .exec();
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found',
      });
      return;
    }

    const otpRecord = await OTP.findOne({
      userId: user._id,
      email,
      otp,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({
        code: 'InvalidOTP',
        message: 'Invalid or expired OTP',
      });
      return;
    }

    if (!user.myReferralCode) {
      let referralCode: string;
      let codeExists: boolean;

      do {
        referralCode = crypto.randomBytes(5).toString('hex').toUpperCase();
        codeExists =
          (await User.exists({ myReferralCode: referralCode })) !== null;
      } while (codeExists);

      await User.updateOne(
        { _id: user._id },
        {
          isEmailVerified: true,
          myReferralCode: referralCode,
        },
      );
    } else {
      // Existing user already has a code – just verify email
      await User.updateOne({ _id: user._id }, { isEmailVerified: true });
    }

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate tokens
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
        myReferralCode: user.myReferralCode,
        role: user.role,
      },
      accessToken,
    });
    logger.info('Email verified and user logged in', { email: user.email });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    logger.error('Error verifying OTP', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error,
    });
  }
};

export default verifyOTP;
