import nodemailer from 'nodemailer';
import config from '@/config/config';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
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

export const sendPurchaseEmail = async (
  to: string,
  subject: string,
  html: string,
) => {
  await transporter.sendMail({
    from: config.EMAIL_FROM,
    to,
    subject,
    html,
  });
};
