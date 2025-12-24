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
const winston_1 = require("@/lib/winston");
const bank_model_1 = __importDefault(require("@/models/bank.model"));
const user_model_1 = __importDefault(require("@/models/user.model"));
const getCurrentUserBank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    try {
        const user = yield user_model_1.default.findById(userId).lean().exec();
        if (!user) {
            res.status(404).json({
                code: 'NotFound',
                message: 'User not found.',
            });
            return;
        }
        const bankAccount = yield bank_model_1.default.findOne({ userId })
            .select('-__v -createdAt -updatedAt')
            .lean()
            .exec();
        if (!bankAccount) {
            res.status(404).json({
                code: 'NotFound',
                message: 'No bank account linked to this user.',
            });
            return;
        }
        winston_1.logger.info('User bank details fetched', { userId });
        res.status(200).json({
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
            message: 'An internal server error occurred while fetching bank details.',
        });
        winston_1.logger.error('Error fetching user bank details', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId,
            error,
        });
    }
});
exports.default = getCurrentUserBank;
//# sourceMappingURL=my-bank.controller.js.map