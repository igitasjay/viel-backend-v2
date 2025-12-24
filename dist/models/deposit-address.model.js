"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const DepositAddressSchema = new mongoose_1.default.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    coin: { type: String, required: true, uppercase: true },
    network: { type: String, required: true, uppercase: true },
    address: { type: String, required: true, unique: true },
    path: { type: String, required: true },
    index: { type: Number, required: true },
    status: {
        type: String,
        enum: ['active', 'used', 'expired'],
        default: 'active',
    },
    txHash: String,
    amount: String,
    confirmedAt: Date,
}, { timestamps: { createdAt: 'createdAt' } });
DepositAddressSchema.index({ user: 1, coin: 1, network: 1 });
exports.default = mongoose_1.default.models.DepositAddress ||
    mongoose_1.default.model('DepositAddress', DepositAddressSchema);
//# sourceMappingURL=deposit-address.model.js.map