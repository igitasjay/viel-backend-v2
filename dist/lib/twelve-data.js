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
exports.fetchLiveRate = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("@/config/config"));
const winston_1 = require("@/lib/winston");
const API_KEY = config_1.default.TWELVE_DATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';
const fetchLiveRate = (symbol) => __awaiter(void 0, void 0, void 0, function* () {
    if (!API_KEY) {
        winston_1.logger.warn('Twelve Data API key not configured.');
        return null;
    }
    try {
        const response = yield axios_1.default.get(`${BASE_URL}/exchange_rate`, {
            params: {
                symbol: `${symbol}/NGN`,
                apikey: API_KEY,
            },
            timeout: 8000,
        });
        if (response.data && response.data.rate) {
            return { ngn: parseFloat(response.data.rate) };
        }
        return null;
    }
    catch (error) {
        winston_1.logger.error(`Twelve Data rate fetch failed for ${symbol}:`, error.message);
        return null;
    }
});
exports.fetchLiveRate = fetchLiveRate;
//# sourceMappingURL=twelve-data.js.map