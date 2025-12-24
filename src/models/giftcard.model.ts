import { Schema, model, Types } from 'mongoose';

export interface IGiftCard {
  country: Types.ObjectId;
  name: string;
  imageUrl: string;
  instruction: string;
  currency: string;
  validAmounts: number[];
  minAmount: number;
  maxAmount: number;
  availableQty: number;
  rate: number;
  isAvailable: boolean;
}

const GiftCardSchema = new Schema<IGiftCard>({
  country: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  instruction: { type: String, required: true },
  currency: { type: String, required: true },
  validAmounts: { type: [Number], required: true },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  availableQty: { type: Number, required: true },
  rate: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
});

const GiftCard = model<IGiftCard>('GiftCard', GiftCardSchema);
export default GiftCard;
