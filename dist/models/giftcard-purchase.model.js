"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const purchaseSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    userEmail: { type: String, required: true },
    giftCardId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'GiftCard', required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
    totalInNaira: { type: Number, required: true },
    sendEmailTo: { type: String, required: true },
    detailsSnapshot: { type: Object, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed', 'declined'],
        default: 'pending',
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('GiftCardPurchase', purchaseSchema);
//# sourceMappingURL=giftcard-purchase.model.js.map