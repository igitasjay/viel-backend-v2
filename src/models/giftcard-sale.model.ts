import { Schema, model, Types } from 'mongoose';
import { IGiftCardSale } from '@/types/giftcard.type';

const SaleSchema = new Schema<IGiftCardSale>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'GiftCardCategory', required: true },
    amount: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalInNaira: { type: Number, required: true },
    images: { type: [String], required: true },
    comment: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'declined'],
      default: 'pending',
    },
    adminComment: { type: String },
  },
  { timestamps: true }
);

export default model<IGiftCardSale>('GiftCardSale', SaleSchema);
