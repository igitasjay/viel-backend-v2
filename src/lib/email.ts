import nodemailer from 'nodemailer';
import config from '@/config/config';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // Use 465 for SSL - much more stable on Render
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS, // MUST be a 16-character App Password
  },
  // 2. Add explicit timeouts to prevent Render from killing the process
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

// export const sendVerificationEmail = async (email: String, otp: String) => {
//   const mailOptions = {
//     from: `"Viel OTP Test" <${process.env.MY_EMAIL}>`,
//     to: email,
//     subject: 'Email Verification OTP',
//     html: `
//       <h1>Email Verification</h1>
//       <p>Your verification code is: <strong>${otp}</strong></p>
//       <p>This code will expire in 10 minutes.</p>
//     `,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent:', info.response);
//     return info;
//   } catch (error) {
//     console.error('Error sending email:', error.message);
//     throw error;
//   }
// };

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
