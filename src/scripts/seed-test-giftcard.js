const mongoose = require("mongoose");
const uri = "mongodb+srv://iamjaypegg:TeU6IVfKZzkjWFOo@cluster0.tnmwpud.mongodb.net/?retryWrites=true&w=majority";

const GiftCardSchema = new mongoose.Schema({
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  instruction: { type: String, required: true },
  currency: { type: String, required: true },
  validAmounts: { type: [Number], required: true },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  availableQty: { type: Number, required: true },
  rate: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
});

const GiftCard = mongoose.model("GiftCard", GiftCardSchema);

async function seed() {
  await mongoose.connect(uri);
  const countryId = "6939354b115d01a980522f6e"; // Nigeria
  await GiftCard.create({
    country: countryId,
    name: "Amazon Nigeria",
    imageUrl: "https://example.com/amazon.png",
    instruction: "Use it on Amazon",
    currency: "NGN",
    validAmounts: [1000, 2000, 5000],
    minAmount: 1000,
    maxAmount: 10000,
    availableQty: 100,
    rate: 1,
    isAvailable: true,
  });
  console.log("Seeded gift card for Nigeria");
  process.exit(0);
}

seed();
