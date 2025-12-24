"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV,
    WHITELISTED_ORIGINS: ['http://localhost:1200'],
    MONGODB_URI: process.env.MONGODB_URI,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES,
    REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES,
    WHITELIST_ADMINS_EMAIL: ['imailasjay@gmail.com', 'iamjaypegg@gmail.com'],
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    TWELVE_DATA_API_KEY: process.env.TWELVE_DATA_API_KEY,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    TENDERLY_RPC_URL: process.env.TENDERLY_RPC_URL,
    FRONTEND_URL: 'https://myviel.ng',
    RPC_URL: process.env.RPC_URL,
};
exports.default = config;
//# sourceMappingURL=config.js.map