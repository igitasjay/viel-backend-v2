"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TransactionSchema = new mongoose_1.Schema({
    id: { type: Number, unique: true, required: true },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['buy_crypto', 'deposit_crypto', 'withdraw_fiat', 'buy_giftcard'],
        required: true,
    },
    coin: { type: String },
    network: { type: String },
    crypto_amount: { type: String },
    fiat_amount: { type: String },
    receive_address: { type: String },
    reference: { type: String, unique: true, sparse: true },
    status: {
        type: String,
        enum: [
            'pending',
            'initialized',
            'paid',
            'processing',
            'completed',
            'failed',
            'cancelled',
        ],
        default: 'pending',
    },
    paystack_data: { type: mongoose_1.Schema.Types.Mixed },
    monnify_data: { type: mongoose_1.Schema.Types.Mixed },
    giftcard_data: { type: mongoose_1.Schema.Types.Mixed },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    image: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
exports.default = (0, mongoose_1.model)('Transaction', TransactionSchema);
//# sourceMappingURL=transaction.model.js.map