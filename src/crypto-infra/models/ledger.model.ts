import mongoose, { Schema, Document } from "mongoose";

export enum LedgerType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRADE_BUY = 'TRADE_BUY',
  TRADE_SELL = 'TRADE_SELL',
  GIFTCARD_BUY = 'GIFTCARD_BUY',
  GIFTCARD_SELL = 'GIFTCARD_SELL',
}

export enum LedgerCategory {
  CRYPTO = 'CRYPTO',
  GIFTCARD = 'GIFTCARD',
}

export enum TransactionAction {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum LedgerSide {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum SystemAccount {
  HOT_WALLET = 'PLATFORM:HOT_WALLET',
  REVENUE = 'PLATFORM:REVENUE',
  GIFTCARD_FLOAT = 'PLATFORM:GIFTCARD_FLOAT',
  INVENTORY = 'PLATFORM:INVENTORY',
}

export interface ILedger extends Document {
  userId: mongoose.Types.ObjectId;
  asset: string;
  amount: string;
  side: LedgerSide;
  account: string;
  counterpartyAccount: string;
  correlationId: string;
  type: LedgerType;
  transactionCategory: LedgerCategory;
  transactionType: TransactionAction;
  referenceId: string;
  description: string;
  tradedAsset?: string;
  image?: string;
  images?: string[];
  status: string;
  affectsBalance?: boolean;
}

const LedgerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    asset: { type: String, required: true },
    amount: { type: String, required: true },
    side: {
      type: String,
      enum: Object.values(LedgerSide),
      required: true,
    },
    account: { type: String, required: true },
    counterpartyAccount: { type: String, required: true },
    correlationId: { type: String, required: true },
    type: { type: String, enum: Object.values(LedgerType), required: true },
    transactionCategory: {
      type: String,
      enum: Object.values(LedgerCategory),
      required: true,
    },
    transactionType: {
      type: String,
      enum: Object.values(TransactionAction),
      required: true,
    },
    referenceId: { type: String, required: true },
    description: { type: String },
    tradedAsset: { type: String },
    image: { type: String },
    images: { type: [String], default: [] },
    status: { type: String, default: 'completed' },
    affectsBalance: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound unique: same refId can exist for CREDIT + DEBIT pair
LedgerSchema.index({ referenceId: 1, side: 1 }, { unique: true });
// Balance query performance
LedgerSchema.index({ account: 1, asset: 1, affectsBalance: 1 });
// Correlation lookup
LedgerSchema.index({ correlationId: 1 });

export const Ledger = mongoose.model<ILedger>("Ledger", LedgerSchema);
