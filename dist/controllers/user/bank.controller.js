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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("@/models/user.model"));
const bank_model_1 = __importDefault(require("@/models/bank.model"));
const winston_1 = require("@/lib/winston");
const mongoose_1 = require("mongoose");
const addBankAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    console.log('user id hererererere:::', userId);
    const { accountNumber, accountName, bankName, bankCode } = req.body;
    if (!accountNumber || !accountName || !bankName || !bankCode) {
        res.status(400).json({
            code: 'ValidationError',
            message: 'All bank details (accountNumber, accountName, bankName, bankCode) are required.',
        });
        return;
    }
    try {
        const user = yield user_model_1.default.findById(userId).exec();
        if (!user) {
            res.status(404).json({
                code: 'NotFound',
                message: 'User not found.',
            });
            return;
        }
        const existingBank = yield bank_model_1.default.findOne({ userId }).exec();
        if (existingBank) {
            res.status(400).json({
                code: 'DuplicateError',
                message: 'You already have a bank account linked. Contact support to update.',
            });
            return;
        }
        const bankAccount = yield bank_model_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            accountNumber,
            accountName,
            bankName,
            bankCode,
        });
        yield user.populate({
            path: 'bankAccount',
            match: { userId: user._id },
            select: '-__v',
        });
        winston_1.logger.info('User bank account added successfully', {
            userId,
            bankId: bankAccount._id,
        });
        res.status(201).json({
            message: 'Bank account added successfully.',
            bankAccount: {
                id: bankAccount._id,
                accountNumber: bankAccount.accountNumber,
                accountName: bankAccount.accountName,
                bankName: bankAccount.bankName,
                bankCode: bankAccount.bankCode,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            code: 'ServerError',
            message: 'An internal server error occurred while adding bank account.',
        });
        winston_1.logger.error('Error adding bank account', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId,
            error,
        });
    }
});
exports.default = addBankAccount;
//# sourceMappingURL=bank.controller.js.map