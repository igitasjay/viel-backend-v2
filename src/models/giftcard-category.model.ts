import { Schema, model, Types } from 'mongoose';
import { IGiftCardCategory } from '@/types/giftcard.type';

const CategorySchema = new Schema<IGiftCardCategory>(
  {
    brandId: { type: Schema.Types.ObjectId, ref: 'GiftCardBrand', required: true },
    country: { type: String, required: true },
    type: { type: String, enum: ['physical', 'digital'], required: true },
    range: { type: String, required: true },
    denominations: { type: [Number], required: true },
    rate: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IGiftCardCategory>('GiftCardCategory', CategorySchema);
