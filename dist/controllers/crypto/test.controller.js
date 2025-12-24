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
const winston_1 = require("@/lib/winston");
function testPaystackTransfer() {
    return __awaiter(this, void 0, void 0, function* () {
        const secretKey = 'sk_test_8eda7e3abe0ca75dc2087b0629608bee7c2d1420';
        const transferData = {
            source: 'balance',
            amount: 500000,
            recipient: 'RCP_gx2wn530m0i3w3m',
            reference: `TEST_TRANSFER_${Date.now()}`,
            currency: 'NGN',
        };
        try {
        }
        catch (error) {
            winston_1.logger.error('Error initiating Paystack transfer:', error);
        }
    });
}
exports.default = testPaystackTransfer;
//# sourceMappingURL=test.controller.js.map