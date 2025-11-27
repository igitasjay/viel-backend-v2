// Run: ts-node src/seed/transaction-seeds.ts
import { connectToDatabase } from '@/lib/mongoose';
import { getNextSequence } from '@/lib/sequence';
import { logger } from '@/lib/winston';

const init = async () => {
  await connectToDatabase();
  await getNextSequence('transactionId'); // Initializes counter to 1
  logger.info('Transaction counter initialized.');
  process.exit(0);
};

init();
