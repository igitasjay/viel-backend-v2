
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkTx() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const Transaction = mongoose.connection.collection('transactions');
    const ref = 'gift_69948ee1f4086a4376f06064_1772164156725';
    const tx = await Transaction.findOne({ reference: ref });
    if (tx) {
      console.log('Transaction found:');
      console.log(JSON.stringify(tx, null, 2));
    } else {
      console.log('Transaction NOT found in DB with reference:', ref);
      const recent = await Transaction.find().sort({ created_at: -1 }).limit(10).toArray();
      console.log('Recent references:', recent.map(t => t.reference));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkTx();
