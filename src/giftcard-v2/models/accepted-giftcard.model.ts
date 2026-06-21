import { Schema, model, Document } from 'mongoose';

export interface IAcceptedGiftCard extends Document {
  brandName: string;
  countryCode: string;
  currency?: string;
  imageUrl?: string;
  availableRanges: string[]; // e.g. ['$10-$50', '$51-$100']
  receiptTypes: string[];    // e.g. ['E-CODE', 'PHYSICAL']
  rates: Record<string, Record<string, number>>; // rates['$10-$50']['PHYSICAL'] = 850
  isActive: boolean;
}

const AcceptedGiftCardSchema = new Schema<IAcceptedGiftCard>(
  {
    brandName: { type: String, required: true },
    countryCode: { type: String, required: true, uppercase: true },
    currency: { type: String },
    imageUrl: { type: String },
    availableRanges: { type: [String], required: true },
    receiptTypes: { type: [String], required: true },
    rates: { type: Schema.Types.Mixed, required: true }, // JSON map of ranges to receipt types to rates
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AcceptedGiftCardSchema.index({ brandName: 1, countryCode: 1 });

export default model<IAcceptedGiftCard>('AcceptedGiftCardV2', AcceptedGiftCardSchema);
