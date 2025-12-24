"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const NetworkSchema = new mongoose_1.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    addressRegex: { type: String, required: true },
    memoRegex: { type: String, default: null },
    fee: { type: String, required: true },
    feeType: { type: String, enum: ['FLAT', 'PERCENTAGE'], required: true },
    minimum: { type: String, required: true },
    contractAddress: { type: String, default: null },
    explorerLink: { type: String, default: null },
    walletAddress: { type: String, required: true },
    enabled: { type: Boolean, default: true },
}, { _id: false });
const CryptoAssetSchema = new mongoose_1.Schema({
    id: { type: Number, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true, uppercase: true, unique: true },
    icon: { type: String, required: true },
    networks: [NetworkSchema],
    status: { type: Number, enum: [0, 1], default: 1 },
    is_stable: { type: Number, enum: [0, 1], default: 0 },
    color: { type: String, required: true },
    minimumDeposit: { type: String, required: true },
    maximumDecimalPlaces: { type: Number, required: true },
    naira_rate: { type: String, required: true },
    usd_rate: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
exports.default = (0, mongoose_1.model)('CryptoAsset', CryptoAssetSchema);
//# sourceMappingURL=crypto.model.js.map