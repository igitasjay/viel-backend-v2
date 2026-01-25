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
exports.disconnectFromDatabase = exports.connectToDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("@/config/config"));
const winston_1 = require("@/lib/winston");
const clientOptions = {
    dbName: 'blog-ts',
    appName: 'Blog TS',
    serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
    },
};
const connectToDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const uri = config_1.default.MONGODB_URI;
    if (!uri)
        throw new Error('MONGODB_URI not set');
    let retries = 5;
    while (retries) {
        try {
            yield mongoose_1.default.connect(uri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            winston_1.logger.info('Connected to MongoDB');
            return;
        }
        catch (error) {
            retries -= 1;
            winston_1.logger.warn(`MongoDB connection failed. Retries left: ${retries}`);
            yield new Promise((res) => setTimeout(res, 2000));
        }
    }
    throw new Error('Failed to connect to MongoDB');
});
exports.connectToDatabase = connectToDatabase;
const disconnectFromDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.disconnect();
        winston_1.logger.info('Disconnected from MongoDB.', {
            uri: config_1.default.MONGODB_URI,
            options: clientOptions,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        winston_1.logger.error('Error disconnecting from MongoDB:', error);
    }
});
exports.disconnectFromDatabase = disconnectFromDatabase;
//# sourceMappingURL=mongoose.js.map