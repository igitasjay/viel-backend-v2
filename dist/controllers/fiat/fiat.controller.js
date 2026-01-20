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
exports.verifyPayment = exports.initializeBuyCrypto = void 0;
const express_validator_1 = require("express-validator");
const crypto_model_1 = __importDefault(require("../../models/crypto.model"));
const transaction_model_1 = __importDefault(require("../../models/transaction.model"));
const twelve_data_1 = require("../../lib/twelve-data");
const winston_1 = require("../../lib/winston");
const sequence_1 = require("../../lib/sequence");
const buyValidation = [
    (0, express_validator_1.body)('coin').trim().notEmpty().toUpperCase(),
    (0, express_validator_1.body)('network').trim().notEmpty().toUpperCase(),
    (0, express_validator_1.body)('amount').isFloat({ min: 0 }),
    (0, express_validator_1.body)('receiveAddress').trim().notEmpty(),
];
exports.initializeBuyCrypto = [
    ...buyValidation,
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ code: 'ValidationError', errors: errors.array() });
            return;
        }
        const { coin, network, amount: cryptoAmountStr, receiveAddress } = req.body;
        const cryptoAmount = parseFloat(cryptoAmountStr);
        try {
            const asset = yield crypto_model_1.default.findOne({
                code: coin,
                status: 1,
                'networks.code': network,
                'networks.enabled': true,
            }).lean();
            if (!asset) {
                res.status(404).json({
                    code: 'NotFound',
                    message: 'Coin or network not supported.',
                });
                return;
            }
            const net = asset.networks.find((n) => n.code === network);
            if (!net) {
                res
                    .status(404)
                    .json({ code: 'NotFound', message: 'Network not enabled.' });
                return;
            }
            const addressRegex = new RegExp(net.addressRegex);
            if (!addressRegex.test(receiveAddress)) {
                res.status(400).json({
                    code: 'InvalidAddress',
                    message: 'Invalid receive address format.',
                });
                return;
            }
            if (cryptoAmount < parseFloat(net.minimum)) {
                res.status(400).json({
                    code: 'BelowMinimum',
                    message: `Minimum buy amount: ${net.minimum} ${coin}`,
                });
                return;
            }
            const live = yield (0, twelve_data_1.fetchLiveRate)(asset.code);
            const rate = parseFloat(String((_a = live === null || live === void 0 ? void 0 : live.ngn) !== null && _a !== void 0 ? _a : asset.naira_rate));
            const nairaAmount = cryptoAmount * rate;
            const reference = `buy_${req.userId}_${Date.now()}`;
            const txId = yield (0, sequence_1.getNextSequence)('transactionId');
            const tx = yield transaction_model_1.default.create({
                id: txId,
                userId: req.userId,
                type: 'buy_crypto',
                coin,
                network,
                crypto_amount: cryptoAmount.toFixed(asset.maximumDecimalPlaces),
                fiat_amount: nairaAmount.toFixed(2),
                receive_address: receiveAddress,
                reference,
                status: 'pending',
                monnify_data: {
                    initiation_source: 'frontend_bank_transfer',
                },
            });
            winston_1.logger.info('Buy crypto transaction initialized (pending payment)', {
                txId,
                reference,
                nairaAmount,
            });
            res.status(201).json({
                message: 'Transaction initialized. Please proceed to payment.',
                data: {
                    reference,
                    naira_amount: nairaAmount.toFixed(2),
                    transactionId: txId,
                },
            });
        }
        catch (error) {
            winston_1.logger.error('Initialize buy failed:', error);
            res
                .status(500)
                .json({ code: 'ServerError', message: 'Initialization failed.' });
        }
    }),
];
exports.verifyPayment = [
    (0, express_validator_1.param)('reference').trim().notEmpty(),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.status(400).json({ message: 'Deprecated for Monnify flow. Use /transactions/:reference/verify' });
    }),
];
//# sourceMappingURL=fiat.controller.js.map