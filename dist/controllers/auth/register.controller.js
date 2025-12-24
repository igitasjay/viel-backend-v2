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
const config_1 = __importDefault(require("../../config/config"));
const user_model_1 = __importDefault(require("../../models/user.model"));
const winston_1 = require("../../lib/winston");
const otp_mode_1 = __importDefault(require("../../models/otp.mode"));
const email_1 = require("../../lib/email");
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstname, lastname, email, password, role } = req.body;
    if (role === 'admin' && !config_1.default.WHITELIST_ADMINS_EMAIL.includes(email)) {
        res.status(403).json({
            code: 'AuthorizationError',
            message: 'Forbidden: You are not allowed to register as admin',
        });
        winston_1.logger.warn(`User with email ${email} tried to register as admin but is not on the whitelist.`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            email,
        });
        return;
    }
    try {
        const newUser = yield user_model_1.default.create({
            firstname,
            lastname,
            email,
            password,
            role,
            isEmailVerified: false,
            verifiedUser: false,
            netTradingVolumn: 0,
            passcode: '',
            nin: '',
            bvn: '',
        });
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        yield otp_mode_1.default.create({
            userId: newUser._id,
            email: newUser.email,
            otp,
            expiresAt,
        });
        try {
            yield (0, email_1.sendEmail)(newUser.email, 'Email Verification OTP', `Your OTP for email verification is: ${otp}. It expires in 10 minutes.`);
        }
        catch (emailError) {
            winston_1.logger.warn('Failed to send verification email', {
                email: newUser.email,
                error: emailError,
            });
        }
        res.status(201).json({
            success: true,
            message: 'User registered. Please verify your email with the OTP sent.',
            title: {
                email: newUser.email,
                otp: otp,
            },
        });
        winston_1.logger.info('New user registered, OTP sent', {
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            email: newUser.email,
            role: newUser.role,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            status: 'error',
            timestamp: new Date().toISOString(),
        });
        winston_1.logger.error('Error registering user', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            error,
        });
    }
});
exports.default = register;
//# sourceMappingURL=register.controller.js.map