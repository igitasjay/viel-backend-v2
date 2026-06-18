import { Schema, model, Document, Types } from 'mongoose';

export interface IQuote extends Document {
  userId: Types.ObjectId;
  quoteId: string;
  coin: string;
  chain: string;
  amountNGN: number;
  cryptoAmount: number;
  rate: number;
  expiresAt: Date;
  status: 'pending' | 'executed' | 'expired';
}

const QuoteSchema = new Schema<IQuote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    quoteId: { type: String, required: true, unique: true },
    coin: { type: String, required: true },
    chain: { type: String, required: true },
    amountNGN: { type: Number, required: true },
    cryptoAmount: { type: Number, required: true },
    rate: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'executed', 'expired'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const QuoteModel = model<IQuote>('CryptoQuoteV2', QuoteSchema);
