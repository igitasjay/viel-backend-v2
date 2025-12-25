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

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: config.EMAIL_FROM,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error('Email send failed:', error);
    throw new Error('Failed to send email');
  }
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
