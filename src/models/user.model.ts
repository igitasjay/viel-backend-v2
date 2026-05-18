import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  isEmailVerified?: boolean;
  verifiedUser?: boolean;
  netTradingVolumn?: string;
  totalBuyVolume?: string;
  totalSellVolume?: string;
  passcode?: string;
  nin?: string;
  bvn?: string;
  myReferralCode?: string;
  referredBy?: string;
  accountStatus?: 'active' | 'suspended' | 'deleted';
  hasPasscode?: boolean;
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
        message: 'Invalid role',
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
      type: String,
      default: '0',
    },
    totalBuyVolume: {
      type: String,
      default: '0',
    },
    totalSellVolume: {
      type: String,
      default: '0',
    },
    passcode: {
      type: String,
      select: false,
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
      sparse: true,
    },
    referredBy: {
      type: String,
      required: false,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
    },
    hasPasscode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.isModified('passcode')) {
    if (this.passcode) {
      this.passcode = await bcrypt.hash(this.passcode, 10);
      this.hasPasscode = true;
    } else {
      this.hasPasscode = false;
    }
  }
});

export default model<IUser>('User', UserSchema);
