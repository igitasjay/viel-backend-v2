import { connectToDatabase, disconnectFromDatabase } from '@/lib/mongoose';
import { Currency } from '@/crypto-infra/models/currency.model';

(async () => {
  try {
    await connectToDatabase();
    console.log('Connected to database');

    const currencies = await Currency.find().limit(1);
    console.log('Found ' + currencies.length + ' currencies');
    
    if (currencies.length > 0) {
        console.log('Currency Data:');
        console.log(JSON.stringify(currencies[0], null, 2));
        console.log('Name field:', currencies[0].name);
    } else {
        console.log('No currencies found in DB');
    }

    await disconnectFromDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
