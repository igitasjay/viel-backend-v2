
import { PriceService } from './src/crypto-infra/services/price.service';

async function test() {
  console.log('Testing PriceService.getLiveRates (TwelveData)...');
  const requests = [
    { symbol: 'BTC', priceSymbol: 'BTC/USD' },
    { symbol: 'ETH', priceSymbol: 'ETH/USD' },
    { symbol: 'SUI', priceSymbol: 'SUI/USD' }
  ];
  try {
    const rates = await PriceService.getLiveRates(requests);
    console.log('Fetched rates:');
    rates.forEach((price, symbol) => {
      console.log(`${symbol}: ${price}`);
    });
    if (rates.size === 0) {
      console.log('Warning: No rates fetched. Check CoinGecko connectivity or symbols.');
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
}

test();
