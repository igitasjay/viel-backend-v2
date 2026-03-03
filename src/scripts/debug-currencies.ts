import mongoose from 'mongoose';
import config from '../config/config';
import { Currency } from '../crypto-infra/models/currency.model';

async function debugCurrencies() {
  try {
    await mongoose.connect(config.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const allCurrencies = await Currency.find();
    console.log('All Currencies in DB:', JSON.stringify(allCurrencies, null, 2));

    const testAssets = allCurrencies.filter(c => c.symbol.startsWith('TEST_'));
    console.log('Test Assets found:', testAssets.length);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugCurrencies();
