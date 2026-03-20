import config from '@/config/config';
import dotenv from 'dotenv';
import { Resend } from 'resend';
dotenv.config();

const resend = new Resend(config.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  firstname: string,
  otp: string,
) => {
  try {
    await resend.emails.send({
      from: `VIEL Auth <${config.EMAIL_FROM}>`,
      to: email,
      subject: `Hello ${firstname},`,
      html:
        '<p>Your OTP for email verification is: <strong>' +
        'V-' +
        otp +
        '</strong>. It expires in 10 minutes.</p>',
    });
    return;
  } catch (error: any) {
    console.error('Error sending email:', error.response?.data || error.message);
    throw error;
  }
};

export const sendForgotPasswordEmail = async (
  email: string,
  firstname: string,
  otp: string,
) => {
  try {
    await resend.emails.send({
      from: `VIEL Auth <${config.EMAIL_FROM}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <p>Hello ${firstname},</p>
        <p>You requested to reset your password. Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      `,
    });
    return;
  } catch (error: any) {
    console.error('Error sending forgot password email:', error);
    throw error;
  }
};
