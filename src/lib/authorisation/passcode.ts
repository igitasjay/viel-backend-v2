import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '@/models/user.model';


export const verifyPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    res.status(200).json({
      success: true,
      message: 'Password verified successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createPasscode = async (req: Request, res: Response) => {
  try {
    const { passcode, password } = req.body;
    const userId = req.userId;

    // 1. Validation: Ensure it's a 4-digit numeric string
    const passcodeRegex = /^\d{4}$/;
    if (!passcodeRegex.test(passcode)) {
      return res.status(400).json({
        message: 'Passcode must be exactly 4 digits.',
      });
    }

    if (!password) {
      return res.status(400).json({
        message: 'Password is required to set passcode.',
      });
    }

    // 2. Find user and update
    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    // 4. Assign the plain text; the pre-save hook will hash it
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
