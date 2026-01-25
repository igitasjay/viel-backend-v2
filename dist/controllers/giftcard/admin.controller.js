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
exports.updateGiftCard = exports.createGiftCard = exports.createCountry = void 0;
const countryService = __importStar(require("@/services/country.service"));
const giftService = __importStar(require("@/services/giftcard.service"));
const async_handler_util_1 = require("@/utils/async-handler.util");
const winston_1 = require("@/lib/winston");
const mongoose_1 = __importDefault(require("mongoose"));
exports.createCountry = (0, async_handler_util_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const country = yield countryService.createCountry(req.body);
    winston_1.logger.info('country added successfully', country);
    res.status(201).json({ success: true, data: country });
}));
exports.createGiftCard = (0, async_handler_util_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }
        const { country, name, instruction, currency, validAmounts: validAmountsRaw, minAmount, maxAmount, availableQty, rate, } = req.body;
        let validAmounts = [];
        if (Array.isArray(validAmountsRaw)) {
            validAmounts = validAmountsRaw
                .map((v) => Number(v))
                .filter((n) => !isNaN(n) && n > 0);
        }
        else if (typeof validAmountsRaw === 'string') {
            const trimmed = validAmountsRaw.trim();
            if (trimmed.startsWith('[')) {
                try {
                    validAmounts = JSON.parse(trimmed)
                        .map((v) => Number(v))
                        .filter((n) => !isNaN(n) && n > 0);
                }
                catch (_a) {
                    validAmounts = [];
                }
            }
            else {
                validAmounts = trimmed
                    .split(',')
                    .map((s) => Number(s.trim()))
                    .filter((n) => !isNaN(n) && n > 0);
            }
        }
        const parsed = {
            country: (country || '').toString().trim(),
            name: (name || '').trim(),
            instruction: (instruction || '').trim(),
            currency: (currency || '').trim(),
            validAmounts,
            minAmount: minAmount
                ? Number(minAmount)
                : Math.min(...(validAmounts.length ? validAmounts : [0])),
            maxAmount: maxAmount
                ? Number(maxAmount)
                : Math.max(...(validAmounts.length ? validAmounts : [0])),
            availableQty: Number(availableQty || 0),
            rate: Number(rate || 0),
        };
        const missing = [];
        if (!parsed.country)
            missing.push('country');
        if (!parsed.name)
            missing.push('name');
        if (!parsed.currency)
            missing.push('currency');
        if (parsed.validAmounts.length === 0)
            missing.push('validAmounts');
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing or invalid required fields',
                missingFields: missing,
            });
        }
        const giftcard = yield giftService.createGiftCard(Object.assign(Object.assign({}, parsed), { imageUrl: req.file.path }));
        winston_1.logger.info('gift card added successfully', giftcard);
        res.status(201).json({ success: true, data: giftcard });
    }
    catch (err) {
        console.error('Gift card creation error:', err);
        res.status(500).json({
            message: 'Error creating gift card',
            error: (err === null || err === void 0 ? void 0 : err.message) || 'Unknown error',
        });
    }
}));
exports.updateGiftCard = (0, async_handler_util_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const id = req.params.id;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json({ success: false, message: 'Invalid gift card ID' });
    }
    const rawValidAmounts = (_a = req.body) === null || _a === void 0 ? void 0 : _a.validAmounts;
    let validAmounts = [];
    if (Array.isArray(rawValidAmounts)) {
        validAmounts = rawValidAmounts
            .map((v) => Number(v))
            .filter((n) => n > 0);
    }
    else if (typeof rawValidAmounts === 'string' && rawValidAmounts.trim()) {
        const trimmed = rawValidAmounts.trim();
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    validAmounts = parsed
                        .map((v) => Number(v))
                        .filter((n) => n > 0);
                }
            }
            catch (_p) {
            }
        }
        else {
            validAmounts = trimmed
                .split(',')
                .map((s) => Number(s.trim()))
                .filter((n) => n > 0);
        }
    }
    const payload = {
        country: (_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.country) === null || _c === void 0 ? void 0 : _c.toString().trim(),
        name: (_e = (_d = req.body) === null || _d === void 0 ? void 0 : _d.name) === null || _e === void 0 ? void 0 : _e.trim(),
        instruction: (_g = (_f = req.body) === null || _f === void 0 ? void 0 : _f.instruction) === null || _g === void 0 ? void 0 : _g.trim(),
        currency: (_j = (_h = req.body) === null || _h === void 0 ? void 0 : _h.currency) === null || _j === void 0 ? void 0 : _j.trim(),
        validAmounts: validAmounts.length > 0 ? validAmounts : undefined,
        minAmount: ((_k = req.body) === null || _k === void 0 ? void 0 : _k.minAmount) ? Number(req.body.minAmount) : undefined,
        maxAmount: ((_l = req.body) === null || _l === void 0 ? void 0 : _l.maxAmount) ? Number(req.body.maxAmount) : undefined,
        availableQty: ((_m = req.body) === null || _m === void 0 ? void 0 : _m.availableQty)
            ? Number(req.body.availableQty)
            : undefined,
        rate: ((_o = req.body) === null || _o === void 0 ? void 0 : _o.rate) ? Number(req.body.rate) : undefined,
    };
    if (req.file)
        payload.imageUrl = req.file.path;
    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
            delete payload[key];
        }
    });
    const updated = yield giftService.updateGiftCard(id, payload);
    if (!updated) {
        return res
            .status(404)
            .json({ success: false, message: 'Gift card not found' });
    }
    res.json({ success: true, data: updated });
}));
//# sourceMappingURL=admin.controller.js.map