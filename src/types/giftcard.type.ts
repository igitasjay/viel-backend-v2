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

export interface IGiftCardType {
  name: 'physical' | 'digital';
  rate: number;
  denominations: number[];
}

export interface IGiftCardRange {
  range: string; // e.g. "100-500"
  types?: IGiftCardType[];
}

export interface IGiftCardCountry {
  name: string;
  iso: string;
  currencySymbol: string; // Moved here
  ranges?: IGiftCardRange[];
}

export interface IGiftCardBrand {
  _id?: string;
  name: string;
  logoUrl: string;
  countries?: IGiftCardCountry[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGiftCardSale {
  _id?: string;
  userId: Types.ObjectId;
  brandId: Types.ObjectId;
  selection: {
    country: string;
    range: string;
    type: string;
    rate: number;
  };
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
