import { Schema, model } from 'mongoose';
import config from '@/config/config';
import bcrypt from 'bcrypt';

export interface IOTP {
  userId: string;
  email: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
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
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

OTPSchema.pre('save', async function (next) {
  if (this.isModified('otp')) {
    this.otp = await bcrypt.hash(this.otp, 10);
  }
  next();
});

export default model<IOTP>('OTP', OTPSchema);
