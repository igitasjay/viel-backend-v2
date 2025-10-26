import config from '@/config';
import User from '@/models/user';
import { IUser } from '@/models/user';
import { logger } from '@/lib/winston';
import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

type UserData = Pick<
  IUser,
  'firstname' | 'lastname' | 'email' | 'phone' | 'password' | 'role'
>;

const register = async (req: Request, res: Response): Promise<void> => {
  const { firstname, lastname, email, phone, password, role } =
    req.body as UserData;

  try {
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      phone,
      password,
      role,
    });

    res.status(201).json({
      message: 'User registered successfully',
      status: 'success',
      data: newUser,
      timestamp: new Date().toISOString(),
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

export { register };
