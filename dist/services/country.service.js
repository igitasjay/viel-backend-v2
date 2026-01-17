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
exports.getAllCountriesWithGiftCards = exports.getCountryById = exports.getAllCountries = exports.createCountry = void 0;
const country_model_1 = __importDefault(require("../models/country.model"));
const createCountry = (payload) => country_model_1.default.create(payload);
exports.createCountry = createCountry;
const getAllCountries = () => country_model_1.default.find().sort({ name: 1 });
exports.getAllCountries = getAllCountries;
const getCountryById = (id) => country_model_1.default.findById(id);
exports.getCountryById = getCountryById;
const getAllCountriesWithGiftCards = () => __awaiter(void 0, void 0, void 0, function* () {
    return country_model_1.default.aggregate([
        {
            $lookup: {
                from: 'giftcards',
                localField: '_id',
                foreignField: 'country',
                as: 'giftCards',
                pipeline: [{ $match: { isAvailable: true } }],
            },
        },
        { $sort: { name: 1 } },
    ]);
});
exports.getAllCountriesWithGiftCards = getAllCountriesWithGiftCards;
//# sourceMappingURL=country.service.js.map