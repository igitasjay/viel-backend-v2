import Country from '../models/country.model';
import { ICountry } from '@/types/giftcard.type';

export const createCountry = (payload: ICountry) => Country.create(payload);
export const getAllCountries = () => Country.find().sort({ name: 1 });
export const getCountryById = (id: string) => Country.findById(id);
