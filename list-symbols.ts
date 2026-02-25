
import { connectToDatabase } from './src/lib/mongoose';
import { Currency } from './src/crypto-infra/models/Currency';
import mongoose from 'mongoose';

async function listSymbols() {
  await connectToDatabase();
  const currencies = await Currency.find();
  const symbols = Array.from(new Set(currencies.map(c => c.symbol)));
  console.log('Symbols in DB:', symbols);
  process.exit(0);
}

listSymbols();
