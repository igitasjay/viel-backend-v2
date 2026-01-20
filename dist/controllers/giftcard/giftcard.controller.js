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
exports.buyGiftCard = exports.listGiftCardsByCountry = exports.listCountries = void 0;
const giftService = __importStar(require("../../services/giftcard.service"));
const countryService = __importStar(require("../../services/country.service"));
const async_handler_util_1 = require("../../utils/async-handler.util");
const user_model_1 = __importDefault(require("../../models/user.model"));
const api_error_util_1 = require("../../utils/api-error.util");
exports.listCountries = (0, async_handler_util_1.asyncHandler)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const countries = yield countryService.getAllCountriesWithGiftCards();
    res.json({ success: true, data: countries });
}));
exports.listGiftCardsByCountry = (0, async_handler_util_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { country } = req.query;
    const giftcards = yield giftService.getGiftCardsByCountry(country);
    res.json({ success: true, data: giftcards });
}));
exports.buyGiftCard = (0, async_handler_util_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { giftCardId, amount, quantity, email } = req.body;
    if (!giftCardId || !amount || !quantity || !email) {
        throw new api_error_util_1.ApiError(400, 'Missing required purchase fields');
    }
    const user = yield user_model_1.default.findById(req.userId);
    if (!user) {
        throw new api_error_util_1.ApiError(404, 'User not found');
    }
    const fullname = `${user.firstname} ${user.lastname}`;
    const purchase = yield giftService.purchaseGiftCard((_a = req.userId) === null || _a === void 0 ? void 0 : _a.toString(), fullname, user.email, giftCardId, Number(amount), Number(quantity), email);
    res.status(201).json({
        success: true,
        message: 'Gift card purchase request submitted successfully',
        data: purchase,
    });
}));
//# sourceMappingURL=giftcard.controller.js.map