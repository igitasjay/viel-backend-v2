"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCountryById = exports.getAllCountries = exports.createCountry = void 0;
const country_model_1 = __importDefault(require("../models/country.model"));
const createCountry = (payload) => country_model_1.default.create(payload);
exports.createCountry = createCountry;
const getAllCountries = () => country_model_1.default.find().sort({ name: 1 });
exports.getAllCountries = getAllCountries;
const getCountryById = (id) => country_model_1.default.findById(id);
exports.getCountryById = getCountryById;
//# sourceMappingURL=country.service.js.map