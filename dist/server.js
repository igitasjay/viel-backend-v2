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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("./lib/express_rate_limit"));
const config_1 = __importDefault(require("./config/config"));
const mongoose_1 = require("./lib/mongoose");
const winston_1 = require("./lib/winston");
const routes_1 = __importDefault(require("./routes/v1/routes"));
const app = (0, express_1.default)();
app.use((0, morgan_1.default)('dev'));
const corsOptions = {
    origin(origin, callback) {
        if (config_1.default.NODE_ENV === 'development' ||
            !config_1.default ||
            config_1.default.WHITELISTED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS error: ${origin} is not allowed by CORS.`), false);
            winston_1.logger.warn(`CORS error: ${origin} is not allowed by CORS.`);
        }
    },
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)({
    threshold: 1024,
}));
app.use((0, helmet_1.default)());
app.use(express_rate_limit_1.default);
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mongoose_1.connectToDatabase)();
    app.use('/uploads', express_1.default.static('uploads'));
    app.use('/api/v1', routes_1.default);
    try {
        app.listen(config_1.default.PORT, () => {
            winston_1.logger.info(`Server is running on http://localhost:${config_1.default.PORT}`);
        });
    }
    catch (error) {
        winston_1.logger.error('Error starting the server:', error);
        if (config_1.default.NODE_ENV == 'production') {
            process.exit(1);
        }
    }
}))();
const handleServerShutdown = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, mongoose_1.disconnectFromDatabase)();
        winston_1.logger.warn('Shutting down server...');
        process.exit(0);
    }
    catch (error) {
        winston_1.logger.error('Error shutting down server', error);
    }
});
process.on('SIGINT', handleServerShutdown);
process.on('SIGTERM', handleServerShutdown);
//# sourceMappingURL=server.js.map