import { Schema, model, Types } from 'mongoose';
import { IGiftCardPurchase } from '@/types/giftcard.type';

const purchaseSchema = new Schema<IGiftCardPurchase>(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    giftCardId: { type: Types.ObjectId, ref: 'GiftCard', required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
    totalInNaira: { type: Number, required: true },
    sendEmailTo: { type: String, required: true },
    detailsSnapshot: { type: Object, required: true },
  },
  { timestamps: true },
);

export default model<IGiftCardPurchase>('GiftCardPurchase', purchaseSchema);
