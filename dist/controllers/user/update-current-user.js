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
const user_model_1 = __importDefault(require("@/models/user.model"));
const winston_1 = require("@/lib/winston");
const updateCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { firstname, lastname, email, phone, password } = req.body;
    try {
        const user = yield user_model_1.default.findById(userId).select('+password -__v').exec();
        if (!user) {
            res.status(404).json({
                code: 'NotFound',
                message: 'User not found.',
            });
            return;
        }
        if (firstname)
            user.firstname = firstname;
        if (lastname)
            user.lastname = lastname;
        if (email)
            user.email = email;
        if (password)
            user.password = password;
        yield user.save();
        winston_1.logger.info('User updated their profile.', user);
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
exports.default = updateCurrentUser;
//# sourceMappingURL=update-current-user.js.map