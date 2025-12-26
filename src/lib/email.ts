// import * as nodemailer from 'nodemailer';
import config from '@/config/config';
import dotenv from 'dotenv';
dotenv.config();

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: config.EMAIL_USER,
//     pass: config.EMAIL_PASS, // MUST be a 16-character App Password
//   },
//   // 2. Add explicit timeouts to prevent Render from killing the process
//   connectionTimeout: 10000,
//   greetingTimeout: 10000,
//   socketTimeout: 10000,
// });
import { Resend } from 'resend';

const resend = new Resend(config.RESEND_API_KEY);

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465, // Use 465 for SSL - much more stable on Render
//   secure: true,
//   auth: {
//     user: config.EMAIL_USER,
//     pass: config.EMAIL_PASS, // MUST be a 16-character App Password
//   },
//   // 2. Add explicit timeouts to prevent Render from killing the process
//   connectionTimeout: 10000,
//   greetingTimeout: 10000,
//   socketTimeout: 10000,
// });

// transporter.verify((error, success) => {
//   if (error) {
//     console.error('SMTP Connection Error:', error);
//   } else {
//     console.log('Server is ready to take our messages');
//   }
// });

export const sendVerificationEmail = async (
  email: string,
  firstname: string,
  otp: string,
) => {
  console.log('send mail called');
  try {
    // = await transporter.sendMail(mailOptions);
    const info = await resend.emails.send({
      from: 'VIEL Auth <info@myviel.com>',
      to: email,
      subject: `Hello ${firstname},`,
      html:
        '<p>Your OTP for email verification is: <strong>' +
        otp +
        '</strong>. It expires in 10 minutes.</p>',
    });
    console.log('Email sent:', info.data);
    return;
  } catch (error: any) {
    console.error('Error sending email:', error.response.data);
    console.error('Error sending email:', error.message);
    throw error;
  }
};

// export const sendEmail = async (
//   to: string,
//   subject: string,
//   text: string,
// ): Promise<void> => {
//   try {
//     await transporter.sendMail({
//       from: config.EMAIL_FROM,
//       to,
//       subject,
//       text,
//     });
//   } catch (error) {
//     console.error('Email send failed:', error);
//     throw new Error('Failed to send email');
//   }
// };

// export const sendPurchaseEmail = async (
//   to: string,
//   subject: string,
//   html: string,
// ) => {
//   await transporter.sendMail({
//     from: config.EMAIL_FROM,
//     to,
//     subject,
//     html,
//   });
// };
