import { ICountry } from '@/types/giftcard.type';
import { Schema, model, Types } from 'mongoose';

const CountrySchema = new Schema<ICountry>({
  name: { type: String, required: true },
  code: { type: String, required: true },
});

CountrySchema.virtual('flag').get(function () {
  return `https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/${this.code.toUpperCase()}.svg`;
});

CountrySchema.set('toJSON', { virtuals: true });
CountrySchema.set('toObject', { virtuals: true });

const Country = model<ICountry>('Country', CountrySchema);

export default Country;
