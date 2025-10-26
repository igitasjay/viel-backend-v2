import config from '@/config';
import User from '@/models/user';
import { IUser } from '@/models/user';
import { logger } from '@/lib/winston';
import { Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import Token from '@/models/token';
import token from '@/models/token';

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

    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    await Token.create({
      userId: newUser._id,
      token: refreshToken,
    });
    logger.info('Refresh token stored in database', {
      userId: newUser._id,
      token: refreshToken,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(201).json({
      user: {
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      accessToken,
    });
    logger.info('New user registered', {
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      phone: newUser.phone,
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

export { register };
