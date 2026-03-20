import config from '@/config/config';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { ForgotPasswordEmail, VerificationEmail } from './email-template';
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
      subject: `Verify your VIEL account, ${firstname}`,
      react: VerificationEmail({ firstname, otp }),
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
      subject: 'Reset Your VIEL Password',
      react: ForgotPasswordEmail({ firstname, otp }),
    });
    return;
  } catch (error: any) {
    console.error('Error sending forgot password email:', error);
    throw error;
  }
};
