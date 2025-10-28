import { Schema, model, Types } from 'mongoose';

export interface IBankAccount {
  userId: Types.ObjectId;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
}

const BankAccountSchema = new Schema<IBankAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true, // Enforces one bank account per user
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      minlength: [10, 'Account number must be at least 10 characters'],
    },
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    bankCode: {
      type: String,
      required: [true, 'Bank code is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default model<IBankAccount>('BankAccount', BankAccountSchema);
