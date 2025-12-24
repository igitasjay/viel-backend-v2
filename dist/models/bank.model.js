"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BankAccountSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true,
    },
    accountNumber: {
        type: String,
        required: [true, 'Account number is required'],
        minlength: [10, 'Account number must be at least 10 characters'],
    },
    accountName: {
        type: String,
        required: [true, 'Account name is required'],
        trim: true,
    },
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true,
    },
    bankCode: {
        type: String,
        required: [true, 'Bank code is required'],
        trim: true,
    },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)('BankAccount', BankAccountSchema);
//# sourceMappingURL=bank.model.js.map