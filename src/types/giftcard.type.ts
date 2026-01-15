import { ObjectId } from 'mongoose';

export interface ICountry {
  _id?: string;
  name: string;
  code: string;
  currency: string; // e.g. "USD"
}

export interface IGiftCard {
  _id?: string;
  countryId: ObjectId; // ObjectId
  brandName: string;
  image: string; // banner or logo URL
  instruction: string; // redemption instructions
  validAmounts: number[]; // canonical valid amounts
  minAmount: number;
  maxAmount: number;
  rate: number; // exchange rate to NGN
  availableQty: number;
  isAvailable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGiftCardPurchase {
  _id?: string;
  userId: ObjectId;
  fullName: string;
  userEmail: string;
  giftCardId: ObjectId;
  quantity: number;
  amount: number; // value per unit
  totalInNaira: number;
  sendEmailTo: string;
  detailsSnapshot: Record<string, any>;
  status: 'pending' | 'completed' | 'declined';
  createdAt?: Date;
}
