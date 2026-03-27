import Router from 'express';
import register from '@/controllers/auth/register.controller';
import login from '@/controllers/auth/login.controller';
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
import rateLimit, { type Options } from 'express-rate-limit';
const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    const email = req.body?.email || 'unidentified';
    return `${ip}-${email}`;
  },
  validate: { keyGeneratorIpFallback: false },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    });
  },
});

router.post(
  '/register',
  authLimiter,
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
  body('referredBy')
    .optional()
    .isString()
    .withMessage('Invalid referral code: must be a string.')
    .isLength({ max: 50 })
    .withMessage('Referral code must not exceed 50 characters.'),
  validationError,
  register,
);

router.post(
  '/login',
  authLimiter,
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
  authLimiter,
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
  authLimiter,
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
  authLimiter,
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email address.'),
  validationError,
  forgotPassword,
);

router.post(
  '/verify-reset-otp',
  authLimiter,
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email address.'),
  body('otp').trim().notEmpty().withMessage('OTP is required.').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
  validationError,
  verifyResetOTP,
);

router.post(
  '/reset-password',
  authLimiter,
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Invalid email address.'),
  body('otp').trim().notEmpty().withMessage('OTP is required.').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits.'),
  body('password').notEmpty().withMessage('Password is required.').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required.'),
  validationError,
  resetPassword,
);

router.post(
  '/refresh-token',
  authLimiter,
  cookie('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required.')
    .isJWT()
    .withMessage('Invalid refresh token.'),
  validationError,
  refreshToken,
);

router.post('/logout', authLimiter, authenticate, logout);

export default router;
