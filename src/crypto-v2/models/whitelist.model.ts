import { Schema, model, Document, Types } from 'mongoose';

export interface IWhitelist extends Document {
  userId: Types.ObjectId;
  coin: string;
  chain: string;
  address: string;
  label?: string;
  isApproved: boolean;
}

const WhitelistSchema = new Schema<IWhitelist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    coin: { type: String, required: true },
    chain: { type: String, required: true },
    address: { type: String, required: true },
    label: { type: String },
    isApproved: { type: Boolean, default: true }, // Set to false if approval flow is required later
  },
  { timestamps: true }
);

// A user should not whitelist the exact same address + coin twice
WhitelistSchema.index({ userId: 1, coin: 1, address: 1 }, { unique: true });

export const WhitelistModel = model<IWhitelist>('CryptoWhitelistV2', WhitelistSchema);
