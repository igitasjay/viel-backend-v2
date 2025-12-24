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
exports.purchaseGiftCard = exports.getGiftCardById = exports.getGiftCardsByCountry = exports.updateGiftCard = exports.createGiftCard = void 0;
const giftcard_model_1 = __importDefault(require("../models/giftcard.model"));
const giftcard_purchase_model_1 = __importDefault(require("../models/giftcard-purchase.model"));
const api_error_util_1 = require("../utils/api-error.util");
const mongoose_1 = __importDefault(require("mongoose"));
const createGiftCard = (payload) => {
    console.log('payload →', {
        minAmount: typeof payload.minAmount,
        maxAmount: typeof payload.maxAmount,
        availableQty: typeof payload.availableQty,
        rate: typeof payload.rate,
    });
    return giftcard_model_1.default.create(payload);
};
exports.createGiftCard = createGiftCard;
const updateGiftCard = (id, payload) => giftcard_model_1.default.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
exports.updateGiftCard = updateGiftCard;
const getGiftCardsByCountry = (countryId) => giftcard_model_1.default.find({ countryId, isAvailable: true });
exports.getGiftCardsByCountry = getGiftCardsByCountry;
const getGiftCardById = (id) => giftcard_model_1.default.findById(id);
exports.getGiftCardById = getGiftCardById;
const purchaseGiftCard = (userId, giftCardId, amount, quantity, email) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const card = yield giftcard_model_1.default.findById(giftCardId).session(session);
        if (!card)
            throw new api_error_util_1.ApiError(404, 'Gift card not found');
        if (!card.isAvailable)
            throw new api_error_util_1.ApiError(400, 'Gift card unavailable');
        if (amount < card.minAmount)
            throw new api_error_util_1.ApiError(400, `Amount cannot be below ${card.minAmount}`);
        if (amount > card.maxAmount)
            throw new api_error_util_1.ApiError(400, `Amount cannot exceed ${card.maxAmount}`);
        if (!card.validAmounts.includes(amount))
            throw new api_error_util_1.ApiError(400, `Invalid amount for this gift card`);
        if (quantity < 1)
            throw new api_error_util_1.ApiError(400, `Quantity must be >= 1`);
        if (quantity > card.availableQty)
            throw new api_error_util_1.ApiError(400, `Requested quantity exceeds available stock`);
        const totalInNaira = amount * quantity * card.rate;
        const purchase = yield giftcard_purchase_model_1.default.create([
            {
                userId,
                giftCardId,
                amount,
                quantity,
                totalInNaira,
                sendEmailTo: email,
                detailsSnapshot: {
                    brandName: card.name,
                    countryId: card.country,
                    instruction: card.instruction,
                    rate: card.rate,
                    image: card.imageUrl,
                    currency: card.rate,
                },
            },
        ], { session });
        card.availableQty -= quantity;
        if (card.availableQty <= 0)
            card.isAvailable = false;
        yield card.save({ session });
        yield session.commitTransaction();
        session.endSession();
        return purchase[0];
    }
    catch (err) {
        yield session.abortTransaction();
        session.endSession();
        throw err;
    }
});
exports.purchaseGiftCard = purchaseGiftCard;
//# sourceMappingURL=giftcard.service.js.map