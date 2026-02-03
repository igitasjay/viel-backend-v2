import Router from 'express';
import register from '@/controllers/auth/register.controller';
import login from '@/controllers/auth/login.comtroller';
import { body, cookie } from 'express-validator';
import validationError from '@/middlewares/validation-error.middleware';
import User from '@/models/user.model';
import refreshToken from '@/controllers/auth/refresh-token.controller';
import logout from '@/controllers/auth/logout.controller';
import authenticate from '@/middlewares/authenticate.middleware';
import verifyOTP from '@/controllers/auth/verify-otp.controller';
import resendOTP from '@/controllers/auth/resend-otp.controller';
import forgotPassword from '@/controllers/auth/forgot-password.controller';
import verifyResetOTP from '@/controllers/auth/verify-reset-otp.controller';
import resetPassword from '@/controllers/auth/reset-password.controller';
const router = Router();

router.post(
  '/register',
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email address.')
    .custom(async (value) => {
      const userExists = await User.exists({ email: value });
      if (userExists) {
        throw new Error('User with this email already exists.');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('firstname').trim().notEmpty().withMessage('First name is required.'),
  body('lastname').trim().notEmpty().withMessage('Last name is required.'),
  body('role')
    .optional()
    .isString()
    .withMessage('Invalid role: must be a string.')
    .isIn(['user', 'admin'])
    .withMessage('Invalid role: must be either user or admin.'),
  validationError,
  register,
);

router.post(
  '/login',
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email address.'),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  validationError,
  login,
);

router.post(
  '/resend-otp',
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email address.'),
  validationError,
  resendOTP,
);

router.post(
  '/verify-otp',
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email address.'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits.'),
  validationError,
  verifyOTP,
);

router.post(
  '/forgot-password',
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email address.'),
  validationError,
  forgotPassword,
);

router.post(
  '/verify-reset-otp',
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email address.'),
  body('otp').trim().notEmpty().withMessage('OTP is required.').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
  validationError,
  verifyResetOTP,
);

router.post(
  '/reset-password',
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email address.'),
  body('otp').trim().notEmpty().withMessage('OTP is required.').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
  body('password').notEmpty().withMessage('Password is required.').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required.'),
  validationError,
  resetPassword,
);

router.post(
  '/refresh-token',
  cookie('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required.')
    .isJWT()
    .withMessage('Invalid refresh token.'),
  validationError,
  refreshToken,
);

router.post('/logout', authenticate, logout);

export default router;
