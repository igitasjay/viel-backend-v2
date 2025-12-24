import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  verifiedUser: boolean;
  netTradingVolumn?: number;
  passcode?: string;
  nin?: string;
  bvn?: string;
  myReferralCode?: string;
  referredBy?: string;
}

const UserSchema = new Schema<IUser>(
  {
    firstname: {
      type: String,
      required: [true, 'Your first name is required'],
      minlength: [2, 'First name must be at least 2 characters long'],
    },
    lastname: {
      type: String,
      required: [true, 'Your last name is required'],
      minlength: [2, 'Last name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: [true, 'Email already exists'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role is either user or admin',
      },
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verifiedUser: {
      type: Boolean,
      default: false,
    },
    netTradingVolumn: {
      type: Number,
      default: 0,
    },
    passcode: {
      type: String,
    },
    nin: {
      type: String,
    },
    bvn: {
      type: String,
    },
    myReferralCode: {
      type: String,
      unique: true,
      default: () => Math.random().toString(36).substring(2, 10).toUpperCase(),
    },
    referredBy: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    // Fixed logic to only hash if password is modified
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export default model<IUser>('User', UserSchema);
