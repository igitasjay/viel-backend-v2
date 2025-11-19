// import { initiatePaystackTransfer } from '@/services/paystack';
import { logger } from '@/lib/winston';
import config from '@/config';

// Test function to initiate a Paystack transfer
async function testPaystackTransfer() {
  const secretKey = 'sk_test_8eda7e3abe0ca75dc2087b0629608bee7c2d1420';

  const transferData = {
    source: 'balance' as const,
    amount: 500000, // Amount in kobo (₦5,000.00)
    recipient: 'RCP_gx2wn530m0i3w3m', // Example recipient code
    reference: `TEST_TRANSFER_${Date.now()}`, // Unique reference
    currency: 'NGN' as const,
  };

  try {
    // const response = await initiatePaystackTransfer(secretKey, transferData);
    // logger.info('Paystack Transfer Response:', response);
  } catch (error) {
    logger.error('Error initiating Paystack transfer:', error);
  }
}

// Execute the test
export default testPaystackTransfer;
