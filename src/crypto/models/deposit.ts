// models/Deposit.ts
import { Schema, model, Document } from 'mongoose';

export type DepositStatus = 'pending' | 'confirmed' | 'failed' | 'credited';

export interface IDeposit extends Document {
  userId?: string; // optional until we map address => user
  address: string; // destination address
  txHash: string;
  from: string;
  to: string;
  chain: string;
  tokenAddress?: string | null; // null for native coin
  amountWei: string; // store as string to be safe
  blockNumber?: number;
  confirmations: number;
  status: DepositStatus;
  firstSeenAt: Date;
  lastUpdatedAt: Date;
  meta?: Record<string, any>;
}

const DepositSchema = new Schema<IDeposit>({
  userId: { type: String, index: true },
  address: { type: String, required: true, index: true },
  txHash: { type: String, required: true },
  from: { type: String },
  to: { type: String },
  chain: { type: String, required: true, default: 'ethereum' },
  tokenAddress: { type: String, default: null },
  amountWei: { type: String, required: true },
  blockNumber: { type: Number },
  confirmations: { type: Number, default: 0 },
  status: { type: String, required: true, default: 'pending' },
  firstSeenAt: { type: Date, default: () => new Date() },
  lastUpdatedAt: { type: Date, default: () => new Date() },
  meta: { type: Schema.Types.Mixed },
});

DepositSchema.index({ txHash: 1 }, { unique: true });

export const Deposit = model<IDeposit>('Deposit', DepositSchema);
