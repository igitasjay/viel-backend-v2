import { Request, Response } from 'express';
import User from '@/models/user.model';
import OTP from '@/models/otp.mode';
import { sendForgotPasswordEmail } from '@/lib/email';
import { logger } from '@/lib/winston';

const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal if user exists or not
      // But usually in forgot password, it's helpful to tell them if the email is not found
      // I'll stick to a standard response but maybe log it.
      res.status(200).json({
        code: 'OTPSENT',
        message: 'If an account with that email exists, we\'ve sent a password reset OTP.',
      });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await OTP.deleteMany({ userId: user._id, email: user.email });

    // Store OTP in database
    await OTP.create({
      userId: user._id,
      email: user.email,
      otp,
      expiresAt,
    });

    // Send Email
    try {
      await sendForgotPasswordEmail(user.email, user.firstname, otp);
    } catch (emailError) {
      logger.error('Failed to send forgot password email', { email: user.email, error: emailError });
      res.status(500).json({
        code: 'EmailError',
        message: 'Failed to send OTP email. Please try again later.',
      });
      return;
    }

    res.status(200).json({
      code: 'Success',
      message: 'Password reset OTP sent to your email.',
    });
    logger.info('Forgot password OTP sent', { email: user.email });
  } catch (error) {
    logger.error('Error in forgotPassword controller', { error });
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
    });
  }
};

export default forgotPassword;
