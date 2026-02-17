import { Schema, model, Types } from 'mongoose';

export interface IReferral {
  referrerId: Types.ObjectId;
  referredUserId: Types.ObjectId;
  status: 'pending_eligibility' | 'eligible' | 'approved' | 'disbursed' | 'rejected';
  rewardAmount: number;
  transactionId?: Types.ObjectId;
  disbursementReference?: string;
  eligibleAt?: Date;
  approvedAt?: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending_eligibility', 'eligible', 'approved', 'disbursed', 'rejected'],
      default: 'pending_eligibility',
    },
    rewardAmount: {
      type: Number,
      default: 0,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    disbursementReference: {
      type: String,
    },
    eligibleAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export default model<IReferral>('Referral', ReferralSchema);
