import mongoose from 'mongoose';

interface GiftCardProduct {
    id: string;
    name: string;
    countryCode: string;
    type: string;
    minAmount: number;
    maxAmount: number;
    fixedAmounts: number[];
    exchangeRate: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const giftCardProductSchema = new mongoose.Schema<GiftCardProduct>({
    id: String,
    name: String,
    countryCode: String,
    type: String,
    minAmount: Number,
    maxAmount: Number,
    fixedAmounts: [Number],
    exchangeRate: Number,
    status: String,
    createdAt: Date,
    updatedAt: Date,
});

const GiftCardProduct = mongoose.model<GiftCardProduct>('GiftCardProduct', giftCardProductSchema);

export default GiftCardProduct;