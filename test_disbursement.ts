import { disburseFunds } from './src/monnify-infra/services/monnify.service';
import { config } from './src/shared/config/config';

async function testDisbursement() {
  try {
    const result = await disburseFunds({
      amount: 200,
      reference: `TEST_DISB_${Date.now()}`,
      narration: "Testing Monnify Disbursement",
      destinationBankCode: "058", // GTBank for testing
      destinationAccountNumber: "0123456789", // Replace with valid test account
      destinationAccountName: "Test Account",
      currency: "NGN"
    });
    console.log('Disbursement Result:', result);
  } catch (error) {
    console.error('Disbursement Failed:', error);
  }
}

testDisbursement();