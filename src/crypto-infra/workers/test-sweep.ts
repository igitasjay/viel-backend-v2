import { connectToDatabase } from '../../lib/mongoose';
import { runSweep } from './sweep-worker';
import { logger } from '../../lib/winston';

async function testSweep() {
  console.log('--- Manual Test Sweep Started ---');
  
  try {
    await connectToDatabase();
    await runSweep();
    console.log('--- Manual Test Sweep Finished ---');
    process.exit(0);
  } catch (error: any) {
    logger.error('Manual sweep failed:', error.message);
    process.exit(1);
  }
}

testSweep();
