import nodemailer from 'nodemailer';
import config from '@/config';

const transporter = nodemailer.createTransport({
  service: 'gmail', // Replace with your email service
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
): Promise<void> => {
  await transporter.sendMail({
    from: config.EMAIL_FROM,
    to,
    subject,
    text,
  });
};
