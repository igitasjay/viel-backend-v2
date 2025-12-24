"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deposit = void 0;
const mongoose_1 = require("mongoose");
const DepositSchema = new mongoose_1.Schema({
    userId: { type: String, index: true },
    address: { type: String, required: true, index: true },
    txHash: { type: String, required: true },
    from: { type: String },
    to: { type: String },
    chain: { type: String, required: true, default: 'ethereum' },
    tokenAddress: { type: String, default: null },
    amountWei: { type: String, required: true },
    blockNumber: { type: Number },
    confirmations: { type: Number, default: 0 },
    status: { type: String, required: true, default: 'pending' },
    firstSeenAt: { type: Date, default: () => new Date() },
    lastUpdatedAt: { type: Date, default: () => new Date() },
    meta: { type: mongoose_1.Schema.Types.Mixed },
});
DepositSchema.index({ txHash: 1 }, { unique: true });
exports.Deposit = (0, mongoose_1.model)('Deposit', DepositSchema);
//# sourceMappingURL=deposit.js.map