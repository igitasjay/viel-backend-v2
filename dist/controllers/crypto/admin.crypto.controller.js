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
exports.deleteCrypto = exports.updateCrypto = exports.createCrypto = void 0;
const crypto_model_1 = __importDefault(require("../../models/crypto.model"));
const winston_1 = require("../../lib/winston");
const express_validator_1 = require("express-validator");
const adminValidation = [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('code').isLength({ min: 2, max: 10 }).toUpperCase(),
    (0, express_validator_1.body)('icon').isURL(),
    (0, express_validator_1.body)('networks').isArray({ min: 1 }),
    (0, express_validator_1.body)('networks.*.walletAddress').notEmpty(),
    (0, express_validator_1.body)('networks.*.enabled').isBoolean(),
];
exports.createCrypto = [
    ...adminValidation,
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            const data = req.body;
            const exists = yield crypto_model_1.default.exists({ code: data.code });
            if (exists) {
                res
                    .status(400)
                    .json({ code: 'Duplicate', message: 'Coin code exists.' });
                return;
            }
            const asset = yield crypto_model_1.default.create(data);
            winston_1.logger.info('Crypto asset created by admin', {
                id: asset.id,
                code: asset.code,
            });
            res.status(201).json({ message: 'Crypto added.', data: asset });
        }
        catch (error) {
            winston_1.logger.error('Admin create crypto failed:', error);
            res
                .status(500)
                .json({ code: 'ServerError', message: 'Creation failed.' });
        }
    }),
];
exports.updateCrypto = [
    (0, express_validator_1.param)('id').isNumeric(),
    ...adminValidation,
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        try {
            const { id } = req.params;
            const updated = yield crypto_model_1.default.findOneAndUpdate({ id: parseInt(id) }, req.body, { new: true });
            if (!updated) {
                res
                    .status(404)
                    .json({ code: 'NotFound', message: 'Crypto not found.' });
                return;
            }
            winston_1.logger.info('Crypto updated by admin', { id, code: updated.code });
            res.status(200).json({ message: 'Updated.', data: updated });
        }
        catch (error) {
            winston_1.logger.error('Admin update failed:', error);
            res.status(500).json({ code: 'ServerError', message: 'Update failed.' });
        }
    }),
];
exports.deleteCrypto = [
    (0, express_validator_1.param)('id').isNumeric(),
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const deleted = yield crypto_model_1.default.findOneAndUpdate({ id: parseInt(id) }, { status: 0 }, { new: true });
            if (!deleted) {
                res.status(404).json({ code: 'NotFound', message: 'Not found.' });
                return;
            }
            winston_1.logger.info('Crypto soft-deleted by admin', { id });
            res.status(200).json({ message: 'Deleted.' });
        }
        catch (error) {
            res.status(500).json({ code: 'ServerError', message: 'Delete failed.' });
        }
    }),
];
//# sourceMappingURL=admin.crypto.controller.js.map