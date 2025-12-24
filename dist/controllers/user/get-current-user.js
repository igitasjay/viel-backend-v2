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
const user_model_1 = __importDefault(require("../../models/user.model"));
const winston_1 = require("../../lib/winston");
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const user = yield user_model_1.default.findById(userId).select('-__v').lean().exec();
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({
            code: 'ServerError',
            message: 'An internal server error occurred during authorization.',
        });
        winston_1.logger.error('Error during authorization middleware.', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            error,
        });
    }
});
exports.default = getCurrentUser;
//# sourceMappingURL=get-current-user.js.map