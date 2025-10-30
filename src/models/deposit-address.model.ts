// src/models/deposit-address.model.ts
import mongoose, { Document } from 'mongoose';

export interface IDepositAddress extends Document {
  user: mongoose.Types.ObjectId;
  coin: string; // e.g. "USDT"
  network: string; // e.g. "ERC20"
  address: string;
  path: string;
  index: number;
  status: 'active' | 'used' | 'expired';
  txHash?: string;
  amount?: string; // in token units (string for big numbers)
  confirmedAt?: Date;
  createdAt: Date;
}

// src/models/deposit-address.model.ts

const DepositAddressSchema = new mongoose.Schema<IDepositAddress>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coin: { type: String, required: true, uppercase: true },
    network: { type: String, required: true, uppercase: true },
    address: { type: String, required: true, unique: true }, // ← creates index
    path: { type: String, required: true },
    index: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'used', 'expired'],
      default: 'active',
    },
    txHash: String,
    amount: String,
    confirmedAt: Date,
  },
  { timestamps: { createdAt: 'createdAt' } },
);

// Compound index for fast user lookups
DepositAddressSchema.index({ user: 1, coin: 1, network: 1 });

export default mongoose.models.DepositAddress ||
  mongoose.model<IDepositAddress>('DepositAddress', DepositAddressSchema);
