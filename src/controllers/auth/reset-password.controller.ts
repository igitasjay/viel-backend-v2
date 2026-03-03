import { Request, Response } from 'express';
import User from '@/models/user.model';
import OTP from '@/models/otp.mode';
import Token from '@/models/token.model';
import { logger } from '@/lib/winston';

const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      res.status(400).json({
        code: 'PasswordMismatch',
        message: 'Passwords do not match.',
      });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        code: 'NotFound',
        message: 'User not found',
      });
      return;
    }

    // Re-verify OTP for security
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

    // Update password
    // The pre-save hook in User model will handle hashing
    user.password = password;
    await user.save();

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpRecord._id });
    await Token.deleteMany({ userId: user._id });


    res.status(200).json({
      code: 'Success',
      message: 'Password reset successful. You can now log in with your new password.',
    });
    logger.info('Password reset successful', { email });
  } catch (error) {
    logger.error('Error in resetPassword controller', { error });
    res.status(500).json({
      code: 'ServerError',
      message: 'Internal server error',
    });
  }
};

export default resetPassword;
