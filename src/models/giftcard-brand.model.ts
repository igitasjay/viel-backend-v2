import { Schema, model } from 'mongoose';
import { IGiftCardBrand, IGiftCardCountry, IGiftCardRange, IGiftCardType } from '@/types/giftcard.type';

const TypeSchema = new Schema<IGiftCardType>({
  name: { type: String, enum: ['physical', 'digital'], required: true },
  rate: { type: Number, required: true },
  denominations: { type: [Number], required: true },
}, { _id: false });

const RangeSchema = new Schema<IGiftCardRange>({
  range: { type: String, required: true },
  types: [TypeSchema],
}, { _id: false });

const CountrySchema = new Schema<IGiftCardCountry>({
  name: { type: String, required: true },
  iso: { type: String, required: true },
  ranges: [RangeSchema],
}, { _id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } });

CountrySchema.virtual('flag').get(function () {
  return `https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/${this.iso.toUpperCase()}.svg`;
});

const BrandSchema = new Schema<IGiftCardBrand>(
  {
    name: { type: String, required: true, unique: true },
    logoUrl: { type: String, required: true },
    currencySymbol: { type: String, required: true },
    countries: [CountrySchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<IGiftCardBrand>('GiftCardBrand', BrandSchema);
