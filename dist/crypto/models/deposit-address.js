"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepositAddress = void 0;
const mongoose_1 = require("mongoose");
const DepositAddressSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    address: { type: String, required: true, index: true },
    chain: { type: String, required: true, default: 'ethereum' },
    createdAt: { type: Date, default: () => new Date() },
    meta: { type: mongoose_1.Schema.Types.Mixed },
});
const DepositAddressModel = mongoose_1.models.DepositAddress ||
    (0, mongoose_1.model)('DepositAddress', DepositAddressSchema);
exports.DepositAddress = DepositAddressModel;
//# sourceMappingURL=deposit-address.js.map