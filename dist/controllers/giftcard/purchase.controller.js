"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fulfillGiftCardPurchase = exports.initiateGiftCardPurchase = void 0;
const user_model_1 = __importDefault(require("../../models/user.model"));
const purchaseService = __importStar(require("../../services/giftcard.service"));
const monnify_service_1 = require("../../services/monnify.service");
const async_handler_util_1 = require("../../utils/async-handler.util");
const api_error_util_1 = require("../../utils/api-error.util");
const email_temeplate_1 = require("../../lib/email-temeplate");
const sequence_1 = require("../../lib/sequence");
const transaction_model_1 = __importDefault(require("../../models/transaction.model"));
const winston_1 = require("../../lib/winston");
exports.initiateGiftCardPurchase = (0, async_handler_util_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { giftCardId, amount, quantity, email } = req.body;
    const userId = (_a = req.userId) === null || _a === void 0 ? void 0 : _a.toString();
    if (!userId) {
        throw new api_error_util_1.ApiError(401, 'Unauthorized');
    }
    const user = yield user_model_1.default.findById(userId);
    if (!user) {
        throw new api_error_util_1.ApiError(404, 'User not found');
    }
    const reference = `gift_${req.userId}_${Date.now()}`;
    const txId = yield (0, sequence_1.getNextSequence)('transactionId');
    const totalAmount = Number(amount) * Number(quantity);
    yield transaction_model_1.default.create({
        id: txId,
        userId: user._id,
        type: 'buy_giftcard',
        fiat_amount: totalAmount.toFixed(2),
        reference,
        status: 'pending',
        monnify_data: {
            initiation_source: 'frontend_bank_transfer',
        },
        giftcard_data: {
            giftCardId,
            amount,
            quantity,
            recipientEmail: email,
        },
    });
    winston_1.logger.info('Gift card purchase initialized (pending payment)', {
        txId,
        reference,
        amount: totalAmount,
    });
    const initTxResponse = yield (0, monnify_service_1.initMonnifyTransaction)({
        amount: totalAmount,
        customerName: `${user.firstname} ${user.lastname}`,
        customerEmail: user.email,
        paymentReference: reference,
        paymentDescription: `Gift Card Purchase - ${reference}`,
        currencyCode: 'NGN',
        contractCode: process.env.MONNIFY_CONTRACT_CODE,
        redirectUrl: 'http://localhost:3000',
        paymentMethods: ["ACCOUNT_TRANSFER"]
    });
    const monnifyRef = initTxResponse.responseBody.transactionReference;
    const monnifyResponse = yield (0, monnify_service_1.initMonnifyBankTransfer)({
        transactionReference: monnifyRef,
        amount: totalAmount,
        customerName: `${user.firstname} ${user.lastname}`,
        customerEmail: user.email,
        paymentDescription: `Gift Card Purchase - ${reference}`,
        currencyCode: 'NGN',
        contractCode: process.env.MONNIFY_CONTRACT_CODE,
    });
    res.status(201).json({
        success: true,
        data: {
            reference,
            amount: totalAmount,
            transactionId: txId,
            paymentDetails: monnifyResponse.responseBody,
        },
    });
}));
const fulfillGiftCardPurchase = (transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const { giftCardId, amount, quantity, recipientEmail } = transaction.giftcard_data;
    const user = yield user_model_1.default.findById(transaction.userId);
    if (!user) {
        throw new Error('User not found for gift card fulfillment');
    }
    const fullName = `${user.firstname} ${user.lastname}`;
    const purchase = yield purchaseService.purchaseGiftCard(user._id.toString(), fullName, user.email, giftCardId, Number(amount), Number(quantity), recipientEmail);
    transaction.giftcard_data.purchase_result = purchase;
    transaction.status = 'completed';
    yield transaction.save();
    const html = (0, email_temeplate_1.purchaseEmailHtml)(purchase);
    return purchase;
});
exports.fulfillGiftCardPurchase = fulfillGiftCardPurchase;
//# sourceMappingURL=purchase.controller.js.map