import 'module-alias/register';
import { connectToDatabase, disconnectFromDatabase } from '../src/lib/mongoose';
import { Currency } from '../src/crypto-infra/models/Currency';
import { PriceService } from '../src/crypto-infra/services/price.service';
import config from '../src/config/config';

// Mock config if needed, or rely on .env loading which module-alias/server usually handles or dotenv
import dotenv from 'dotenv';
dotenv.config();

const debug = async () => {
  try {
    await connectToDatabase();
    console.log('Connected to DB');

    const rawCurrencies = await Currency.find();
    console.log(`Found ${rawCurrencies.length} currencies`);

    const symbols = Array.from(new Set(rawCurrencies.map((c: any) => c.symbol)));
    console.log('Unique Symbols:', symbols);

    console.log('Fetching live rates...');
    const liveRates = await PriceService.getLiveRates(symbols); 
    
    console.log('Live Rates Map Keys:', Array.from(liveRates.keys()));
    console.log('Live Rates Map Values:', Object.fromEntries(liveRates));

    // Simulate the mapping logic
    for (const curr of rawCurrencies) {
        const liveRate = liveRates.get(curr.symbol);
        const fallbackRate = curr.usd_rate;
        const finalRate = (liveRate ?? fallbackRate)?.toFixed(10);
        console.log(`Symbol: ${curr.symbol}, Live: ${liveRate}, Fallback: ${fallbackRate}, Final: ${finalRate}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await disconnectFromDatabase();
  }
};

debug();
