import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  currency: string; // USDT
  network: string; // ERC20
  address: string; // 0x123...
  derivationPath: string; // m/44'/60'/0'/0/5
  balance: number; // Cached balance (optional, source of truth is Ledger)
}

const WalletSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currency: { type: String, required: true },
    network: { type: String, required: true },
    address: { type: String, required: true },
    derivationPath: { type: String, required: true },
    // NOTE: In production, we index 'address' heavily for the Watcher service
  },
  { timestamps: true }
);

WalletSchema.index({ address: 1, network: 1 }, { unique: true });

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);
