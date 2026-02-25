import mongoose, { Schema, Document } from "mongoose";

export interface ICurrency extends Document {
  symbol: string; // USDT
  name: string; // Tether
  code: string; // USDT (alias for symbol for consistency with target JSON)
  network: string; // ERC20, TRC20, BTC
  contractAddress?: string; // Null for Native ETH/BTC
  
  // New Fields
  addressRegex?: string;
  memoRegex?: string;
  fee?: number; // stored as number
  feeType?: 'FLAT' | 'PERCENTAGE';
  minimum?: number;
  explorerLink?: string;
  
  decimals: number;
  imageUrl: string; // Path to uploaded image
  
  // Coin Level Details (Common across networks)
  is_stable: boolean;
  color: string;
  minimumDeposit: number;
  maximumDecimalPlaces: number;
  naira_rate: number; // Stored as number, returned as string if needed
  usd_rate: number;
  status: number; // 0 or 1
  
  buyRate: number; // explicit rate in Naira
  sellRate: number; // explicit rate in Naira
  isActive: boolean;
  price_symbol?: string; // e.g. BTC/USD for TwelveData
}

const CurrencySchema = new Schema(
  {
    symbol: { type: String, required: true, uppercase: true }, // acts as 'code'
    name: { type: String, required: true },
    network: { type: String, required: true }, // e.g., 'ERC20'
    contractAddress: { type: String, default: null },
    
    // Network Details
    addressRegex: { type: String, default: null },
    memoRegex: { type: String, default: null },
    fee: { type: Number, default: 0 },
    feeType: { type: String, enum: ['FLAT', 'PERCENTAGE'], default: 'FLAT' },
    minimum: { type: Number, default: 0 },
    explorerLink: { type: String, default: null },

    decimals: { type: Number, default: 18 },
    imageUrl: { type: String, required: true }, // acts as 'icon'
    
    // Coin Details
    is_stable: { type: Boolean, default: false },
    color: { type: String, default: '#000000' },
    minimumDeposit: { type: Number, default: 0 },
    maximumDecimalPlaces: { type: Number, default: 8 },
    naira_rate: { type: Number, default: 0 },
    usd_rate: { type: Number, default: 0 },
    status: { type: Number, default: 1 }, // 1 = active, 0 = inactive

    buyRate: { type: Number, default: 0 },
    sellRate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    price_symbol: { type: String, default: null },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate pairs (e.g., USDT-ERC20 twice)
CurrencySchema.index({ symbol: 1, network: 1 }, { unique: true });

export const Currency = mongoose.model<ICurrency>("Currency", CurrencySchema);
