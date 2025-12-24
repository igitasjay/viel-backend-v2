"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paystack_service_1 = require("../../services/paystack.service");
const router = (0, express_1.Router)();
router.post('/charge', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, amount, bank, birthday, metadata } = req.body;
    if (!email ||
        !amount ||
        !(bank === null || bank === void 0 ? void 0 : bank.account_number) ||
        !(bank === null || bank === void 0 ? void 0 : bank.code) ||
        typeof bank.code !== 'string' ||
        !birthday) {
        return res.status(400).json({
            error: 'Missing or invalid required fields',
            details: 'Ensure email, amount, bank.account_number, bank.code (string), and birthday are provided',
        });
    }
    try {
        const payload = {
            email,
            amount: amount * 100,
            bank: {
                account_number: bank.account_number,
                code: bank.code,
            },
            birthday,
            metadata: metadata || {
                custom_fields: [
                    {
                        value: 'makurdi',
                        display_name: 'Donation for',
                        variable_name: 'donation_for',
                    },
                ],
            },
        };
        const result = yield (0, paystack_service_1.chargeBankAccount)(payload);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Charge error:', error.message, error.stack);
        res.status(500).json({
            error: 'Charge failed',
            errorDetails: {
                message: error.message || 'Unknown error',
                stack: error.stack || 'No stack trace available',
                paystackResponse: error.paystackResponse || null,
                status: error.status || null,
            },
        });
    }
}));
router.post('/submit-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { otp, reference } = req.body;
    if (!otp ||
        !reference ||
        typeof otp !== 'string' ||
        typeof reference !== 'string') {
        return res.status(400).json({
            error: 'Missing or invalid required fields',
            details: 'Ensure otp and reference are provided as strings',
        });
    }
    try {
        const payload = {
            otp,
            reference,
        };
        const result = yield (0, paystack_service_1.submitOtp)(payload);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('OTP submission error:', error.message, error.stack);
        res.status(500).json({
            error: 'OTP submission failed',
            errorDetails: {
                message: error.message || 'Unknown error',
                stack: error.stack || 'No stack trace available',
                paystackResponse: error.paystackResponse || null,
                status: error.status || null,
            },
        });
    }
}));
exports.default = router;
//# sourceMappingURL=charge.route.js.map