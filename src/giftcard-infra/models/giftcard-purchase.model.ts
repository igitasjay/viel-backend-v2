import { Schema, model, Types } from 'mongoose';
import { IGiftCardPurchase } from '@/types/giftcard.type';

const purchaseSchema = new Schema<IGiftCardPurchase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    userEmail: { type: String, required: true },
    giftCardId: { type: Schema.Types.ObjectId, ref: 'GiftCard', required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
    totalInNaira: { type: Number, required: true },
    sendEmailTo: { type: String, required: true },
    detailsSnapshot: { type: Object, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'declined'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export default model<IGiftCardPurchase>('GiftCardPurchase', purchaseSchema);
