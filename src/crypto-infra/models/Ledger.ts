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

export interface ILedger extends Document {
  userId: mongoose.Types.ObjectId;
  asset: string; // NGN, USDT, ETH
  amount: number; // Positive for credit, Negative for debit
  type: LedgerType;
  transactionCategory: LedgerCategory;
  transactionType: TransactionAction;
  referenceId: string; // TxHash or Internal Trade ID
  description: string;
  image?: string;
}

const LedgerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    asset: { type: String, required: true }, // 'NGN' or 'USDT'
    amount: { type: Number, required: true },
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
    referenceId: { type: String, required: true, unique: true }, // Idempotency Key
    description: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

export const Ledger = mongoose.model<ILedger>("Ledger", LedgerSchema);
