import { Request, Response } from 'express';
import User from '@/models/user.model';
import OTP from '@/models/otp.mode';
import { logger } from '@/lib/winston';
import bcrypt from 'bcrypt';

const verifyResetOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
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
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({
        code: 'InvalidOTP',
        message: 'Invalid or expired OTP',
      });
      return;
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      res.status(429).json({
        code: 'TooManyAttempts',
        message: 'Too many failed OTP attempts. Please request a new OTP.',
      });
      return;
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      res.status(400).json({
        code: 'InvalidOTP',
        message: 'Invalid OTP',
      });
      return;
    }

    res.status(200).json({
      code: 'Success',
      message: 'OTP verified successfully. You can now reset your password.',
    });
    logger.info('Reset OTP verified', { email });
  } catch (error) {
    logger.error('Error in verifyResetOTP controller', { error });
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
    });
  }
};

export default verifyResetOTP;
