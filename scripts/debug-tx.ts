
// import { connectToDatabase, disconnectFromDatabase } from './src/lib/mongoose';
// import Transaction from './src/models/transaction.model';

// async function checkTx() {
//   await connectToDatabase();
//   const ref = 'gift_69948ee1f4086a4376f06064_1772164156725';
//   const tx = await Transaction.findOne({ reference: ref });
//   if (tx) {
//     console.log('Transaction found:');
//     console.log(JSON.stringify(tx, null, 2));
//   } else {
//     console.log('Transaction NOT found in DB with reference:', ref);
//     // Let's also look for any recent transactions
//     const recent = await Transaction.find().sort({ created_at: -1 }).limit(5);
//     console.log('Recent transactions references:', recent.map(t => t.reference));
//   }
//   await disconnectFromDatabase();
//   process.exit(0);
// }

// checkTx();
