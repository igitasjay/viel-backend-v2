import User from '@/models/user.model';
import { logger } from '@/lib/winston';
import { Request, Response } from 'express';
import OTP from '@/models/otp.mode';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

const resendOTP = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({
        code: 'BadRequest',
        message: 'Bad Request',
      });
      return;
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OTP.deleteMany({ userId: user._id, email: user.email });

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
      res.status(500).json({
        code: 'EmailError',
        message: 'Failed to send verification email',
      });
      return;
    }

    res.status(200).json({
      code: 'Success',
      message: 'OTP resent successfully',
    });
  } catch (error) {
    logger.error('Error in resending OTP', { error });
    res.status(500).json({
      code: 'ServerError',
      message: 'An error occurred while resending OTP',
    });
  }
};

export default resendOTP;
