import { Request, Response } from 'express';
import User from '@/models/user.model';

export const createPasscode = async (req: Request, res: Response) => {
  try {
    const { passcode } = req.body;
    const userId = req.userId;

    // 1. Validation: Ensure it's a 6-digit numeric string
    const passcodeRegex = /^\d{4}$/;
    if (!passcodeRegex.test(passcode)) {
      return res.status(400).json({
        message: 'Passcode must be exactly 4 digits.',
      });
    }

    // 2. Find user and update
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 3. Assign the plain text; the pre-save hook will hash it
    user.passcode = passcode;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Passcode set successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
