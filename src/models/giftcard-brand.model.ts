import { Schema, model } from 'mongoose';
import { IGiftCardBrand } from '@/types/giftcard.type';

const BrandSchema = new Schema<IGiftCardBrand>(
  {
    name: { type: String, required: true, unique: true },
    logoUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IGiftCardBrand>('GiftCardBrand', BrandSchema);
