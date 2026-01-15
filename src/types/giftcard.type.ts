import { Types } from 'mongoose';

export interface ICountry {
  _id?: string;
  name: string;
  code: string;
  currency: string; // e.g. "USD"
}

export interface IGiftCard {
  _id?: string;
  countryId: Types.ObjectId; // Types.ObjectId
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
  userId: Types.ObjectId;
  fullName: string;
  userEmail: string;
  giftCardId: Types.ObjectId;
  quantity: number;
  amount: number; // value per unit
  totalInNaira: number;
  sendEmailTo: string;
  detailsSnapshot: Record<string, any>;
  status: 'pending' | 'completed' | 'declined';
  createdAt?: Date;
}

export interface IGiftCardBrand {
  _id?: string;
  name: string;
  logoUrl: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGiftCardCategory {
  _id?: string;
  brandId: Types.ObjectId;
  country: string; // e.g. "USA", "UK"
  type: 'physical' | 'digital';
  range: string; // e.g. "50-100", "101-500"
  denominations: number[]; // e.g. [50, 100, 200]
  rate: number; // exchange rate to NGN
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGiftCardSale {
  _id?: string;
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  amount: number; // Face value per card
  quantity: number;
  totalInNaira: number;
  images: string[]; // Up to 10 image URLs
  comment?: string;
  status: 'pending' | 'processing' | 'completed' | 'declined';
  adminComment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
