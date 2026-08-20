import { resolveMonnifyBankAccount } from './src/monnify-infra/services/monnify.service';

async function test() {
  try {
    const res = await resolveMonnifyBankAccount('9024492577', '305');
    console.log(JSON.stringify(res, null, 2));
  } catch (e: any) {
    console.log(e.message, e.monnifyResponse);
  }
}
test();
