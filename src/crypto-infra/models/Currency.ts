import mongoose, { Schema, Document } from "mongoose";

export interface ICurrency extends Document {
  symbol: string; // USDT
  name: string; // Tether
  network: string; // ERC20, TRC20, BTC
  contractAddress?: string; // Null for Native ETH/BTC
  decimals: number;
  imageUrl: string; // Path to uploaded image
  buySpread: number; // e.g., 2.5%
  sellSpread: number; // e.g., 2.0%
  isActive: boolean;
}

const CurrencySchema = new Schema(
  {
    symbol: { type: String, required: true, uppercase: true },
    network: { type: String, required: true }, // e.g., 'ERC20'
    contractAddress: { type: String, default: null },
    decimals: { type: Number, default: 18 },
    imageUrl: { type: String, required: true },
    buySpread: { type: Number, default: 0 },
    sellSpread: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate pairs (e.g., USDT-ERC20 twice)
CurrencySchema.index({ symbol: 1, network: 1 }, { unique: true });

export const Currency = mongoose.model<ICurrency>("Currency", CurrencySchema);
