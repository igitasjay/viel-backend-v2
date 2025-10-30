// src/models/counter.model.ts
import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "depositIndex:ERC20"
  seq: { type: Number, default: 0 },
});

export default mongoose.models.Counter ||
  mongoose.model('Counter', CounterSchema);
