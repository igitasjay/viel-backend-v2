import { connectToDatabase } from '../../lib/mongoose';
import { Wallet } from '../models/wallet.model';

async function checkWallets() {
  await connectToDatabase();
  const networks = await Wallet.distinct('network');
  console.log('Networks found in DB:', networks);
  
  for (const network of networks) {
    const count = await Wallet.countDocuments({ network });
    console.log(`Network: ${network}, Count: ${count}`);
  }
  process.exit(0);
}

checkWallets();
