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
exports.verifyTransaction = exports.initializeTransaction = void 0;
const initializeTransaction = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.assign(Object.assign({}, payload), { amount: Math.round(payload.amount * 100), currency: 'NGN' })),
    });
    if (!response.ok)
        throw new Error(`Paystack init failed: ${response.statusText}`);
    return response.json();
});
exports.initializeTransaction = initializeTransaction;
const verifyTransaction = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
    });
    if (!response.ok)
        throw new Error(`Paystack verify failed: ${response.statusText}`);
    return response.json();
});
exports.verifyTransaction = verifyTransaction;
//# sourceMappingURL=paystack.js.map