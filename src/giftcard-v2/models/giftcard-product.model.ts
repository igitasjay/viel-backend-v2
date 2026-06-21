import { Schema, model, Document } from 'mongoose';

export interface IGiftcardProduct extends Document {
  reloadlyId: number;
  countryCode: string;
  name: string;
  denominationType: 'FIXED' | 'RANGE';
  fixedDenominations: number[];
  minAmount: number;
  maxAmount: number;
  exchangeRate: number; // Client multiplies cardValue by exchangeRate for RANGE cards
  feeConfiguration: {
    type: 'FIXED' | 'PERCENTAGE';
    value: number;
  };
  isActive: boolean;
  updatedAt: Date;
}

const GiftcardProductSchema = new Schema<IGiftcardProduct>(
  {
    reloadlyId: { type: Number, required: true, unique: true },
    countryCode: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
    denominationType: {
      type: String,
      enum: ['FIXED', 'RANGE'],
      required: true,
    },
    fixedDenominations: { type: [Number], default: [] },
    minAmount: { type: Number, default: 0 },
    maxAmount: { type: Number, default: 0 },
    exchangeRate: { type: Number, required: true },
    feeConfiguration: {
      type: {
        type: String,
        enum: ['FIXED', 'PERCENTAGE'],
        default: 'FIXED',
      },
      value: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for fast lookup
GiftcardProductSchema.index({ countryCode: 1, isActive: 1 });
GiftcardProductSchema.index({ reloadlyId: 1 });

export default model<IGiftcardProduct>('GiftcardProductV2', GiftcardProductSchema);
