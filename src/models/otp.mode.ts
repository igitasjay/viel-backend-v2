import { Schema, model } from 'mongoose';
import config from '@/config/config';

export interface IOTP {
  userId: string;
  email: string;
  otp: string;
  expiresAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    userId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // MongoDB will auto-delete expired documents
    },
  },
  {
    timestamps: true,
  },
);

export default model<IOTP>('OTP', OTPSchema);
