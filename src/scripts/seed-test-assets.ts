import mongoose from 'mongoose';
import config from '../config/config';
import { Currency } from '../crypto-infra/models/currency.model';
import GiftCardBrand from '../giftcard-infra/models/giftcard-brand.model';
import GiftCard from '../giftcard-infra/models/giftcard.model';
import Country from '../models/country.model';
import { logger } from '../lib/winston';

async function seedTestAssets() {
  try {
    await mongoose.connect(config.MONGODB_URI as string);
    logger.info('Connected to MongoDB for Test Asset Seeding');

    // --- SEED CRYPTO TEST ASSETS ---
    const testBuyCrypto = {
      name: 'TEST BUY CRYPTO',
      symbol: 'TEST_BUY_CRYPTO',
      network: 'BEP20',
      addressRegex: '^0x[a-fA-F0-9]{40}$',
      imageUrl:
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      is_stable: true,
      color: '#4CAF50',
      minimumDeposit: 10,
      maximumDecimalPlaces: 2,
      buyRate: 1500,
      sellRate: 1450,
      naira_rate: 1500,
      usd_rate: 1,
      isActive: true,
      status: 1,
    };

    const testSellCrypto = {
      ...testBuyCrypto,
      name: 'TEST SELL CRYPTO',
      symbol: 'TEST_SELL_CRYPTO',
      naira_rate: 1450,
      usd_rate: 0.98,
      color: '#F44336',
    };

    await Currency.findOneAndUpdate(
      { symbol: testBuyCrypto.symbol, network: testBuyCrypto.network },
      testBuyCrypto,
      { upsert: true, new: true },
    );

    await Currency.findOneAndUpdate(
      { symbol: testSellCrypto.symbol, network: testSellCrypto.network },
      testSellCrypto,
      { upsert: true, new: true },
    );
    logger.info('Crypto test assets seeded.');

    // --- SEED GIFTCARD TEST ASSETS ---
    let usaCountry = await Country.findOne({ code: 'US' });
    if (!usaCountry) {
      usaCountry = await Country.create({ name: 'United States', code: 'US' });
    }

    const brandPayload = {
      name: 'TEST GIFTCARD BRAND',
      logoUrl:
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      isActive: true,
      countries: [
        {
          name: 'United States',
          iso: 'US',
          currencySymbol: '$',
          ranges: [
            {
              range: '10-500',
              types: [
                {
                  name: 'digital',
                  rate: 1000,
                  denominations: [10, 50, 100, 500],
                },
              ],
            },
          ],
        },
      ],
    };

    const giftcardBrand = await GiftCardBrand.findOneAndUpdate(
      { name: brandPayload.name },
      brandPayload,
      { upsert: true, new: true },
    );

    const buyGiftCardPayload = {
      country: usaCountry._id,
      name: 'TEST_BUY_GIFTCARD',
      imageUrl: giftcardBrand.logoUrl,
      instruction:
        'This is a test asset for App/Play Store simulation. Passcode is 1234.',
      currency: 'USD',
      validAmounts: [10, 50, 100, 500],
      minAmount: 10,
      maxAmount: 500,
      availableQty: 9999,
      rate: 1000,
      isAvailable: true,
    };

    const sellGiftCardPayload = {
      ...buyGiftCardPayload,
      name: 'TEST_SELL_GIFTCARD',
    };

    await GiftCard.findOneAndUpdate(
      { name: buyGiftCardPayload.name },
      buyGiftCardPayload,
      { upsert: true, new: true },
    );

    await GiftCard.findOneAndUpdate(
      { name: sellGiftCardPayload.name },
      sellGiftCardPayload,
      { upsert: true, new: true },
    );

    logger.info('Giftcard test assets seeded.');

    mongoose.disconnect();
    logger.info('Finished seeding. Exiting...');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed test assets:', error);
    process.exit(1);
  }
}

seedTestAssets();
