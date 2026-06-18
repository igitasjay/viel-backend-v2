import { Schema, model, Document, Types } from 'mongoose';

export interface ICryptoWallet extends Document {
  userId: Types.ObjectId;
  address: string;
  provider: string;
  asset: string;
  chain: string;
  qrCode?: string;
}

const CryptoWalletSchema = new Schema<ICryptoWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    address: { type: String, required: true, index: true },
    provider: { type: String, default: 'OBIEX' },
    asset: { type: String, required: true },
    chain: { type: String, required: true },
    qrCode: { type: String },
  },
  { timestamps: true }
);

// Prevent duplicate wallets for the same asset/chain combo
CryptoWalletSchema.index({ userId: 1, asset: 1, chain: 1 }, { unique: true });

export const CryptoWalletModel = model<ICryptoWallet>('CryptoWalletV2', CryptoWalletSchema);
