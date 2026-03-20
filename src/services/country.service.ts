import Country from '../models/country.model';
import { ICountry } from '@/types/giftcard.type';

export const createCountry = (payload: ICountry) => Country.create(payload);
export const getAllCountries = () => Country.find().sort({ name: 1 });
export const getCountryById = (id: string) => Country.findById(id);

export const getAllCountriesWithGiftCards = async (showTestAssets: boolean = true) => {
  const matchPipeline = showTestAssets 
    ? { isAvailable: true }
    : { isAvailable: true, name: { $not: /^TEST[ _]/ } };

  return Country.aggregate([
    {
      $lookup: {
        from: 'giftcards',
        localField: '_id',
        foreignField: 'country',
        as: 'giftCards',
        pipeline: [{ $match: matchPipeline }],
      },
    },
    {
      $addFields: {
        flag: {
          $concat: [
            'https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/',
            { $toUpper: '$code' },
            '.svg',
          ],
        },
      },
    },
    { $sort: { name: 1 } },
  ]);
};
