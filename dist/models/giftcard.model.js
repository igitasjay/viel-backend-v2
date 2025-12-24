"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const GiftCardSchema = new mongoose_1.Schema({
    country: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Country', required: true },
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
const GiftCard = (0, mongoose_1.model)('GiftCard', GiftCardSchema);
exports.default = GiftCard;
//# sourceMappingURL=giftcard.model.js.map