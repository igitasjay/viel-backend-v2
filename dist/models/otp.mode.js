"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const OTPSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0,
    },
}, {
    timestamps: true,
});
exports.default = (0, mongoose_1.model)('OTP', OTPSchema);
//# sourceMappingURL=otp.mode.js.map