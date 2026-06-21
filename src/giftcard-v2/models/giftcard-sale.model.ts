import { Schema, model, Types, Document } from 'mongoose';

export interface IGiftcardSale extends Document {
  userId: Types.ObjectId;
  acceptedCardId: Types.ObjectId;
  brandName: string;
  cardRange: string;
  receiptType: string;
  cardValue: number;
  quantity: number;
  rateApplied: number;
  expectedPayout: number;
  images: string[];
  promoCode?: string;
  cardCode?: string;
  cardPin?: string;
  status: 'SUBMITTED' | 'PROCESSING' | 'APPROVED' | 'DECLINED';
  adminComment?: string;
}

const GiftcardSaleSchema = new Schema<IGiftcardSale>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    acceptedCardId: { type: Schema.Types.ObjectId, ref: 'AcceptedGiftCardV2', required: true },
    brandName: { type: String, required: true },
    cardRange: { type: String, required: true }, // Normalized
    receiptType: { type: String, required: true }, // Normalized
    cardValue: { type: Number, required: true },
    quantity: { type: Number, required: true },
    rateApplied: { type: Number, required: true },
    expectedPayout: { type: Number, required: true },
    images: { type: [String], required: true },
    promoCode: { type: String },
    cardCode: { type: String }, // Should be encrypted at rest, typically handled by mongoose pre-save or in service layer
    cardPin: { type: String },
    status: {
      type: String,
      enum: ['SUBMITTED', 'PROCESSING', 'APPROVED', 'DECLINED'],
      default: 'SUBMITTED',
    },
    adminComment: { type: String },
  },
  { timestamps: true }
);

export default model<IGiftcardSale>('GiftcardSaleV2', GiftcardSaleSchema);
