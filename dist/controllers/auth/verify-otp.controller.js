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
const jwt_1 = require("../../lib/jwt");
const user_model_1 = __importDefault(require("../../models/user.model"));
const token_model_1 = __importDefault(require("../../models/token.model"));
const winston_1 = require("../../lib/winston");
const otp_mode_1 = __importDefault(require("../../models/otp.mode"));
const config_1 = __importDefault(require("../../config/config"));
const crypto_1 = __importDefault(require("crypto"));
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        const user = yield user_model_1.default.findOne({ email })
            .select('firstname lastname email phone role isEmailVerified')
            .lean()
            .exec();
        if (!user) {
            res.status(404).json({
                code: 'NotFound',
                message: 'User not found',
            });
            return;
        }
        const otpRecord = yield otp_mode_1.default.findOne({
            userId: user._id,
            email,
            otp,
            expiresAt: { $gt: new Date() },
        });
        if (!otpRecord) {
            res.status(400).json({
                code: 'InvalidOTP',
                message: 'Invalid or expired OTP',
            });
            return;
        }
        if (!user.myReferralCode) {
            let referralCode;
            let codeExists;
            do {
                referralCode = crypto_1.default.randomBytes(5).toString('hex').toUpperCase();
                codeExists =
                    (yield user_model_1.default.exists({ myReferralCode: referralCode })) !== null;
            } while (codeExists);
            yield user_model_1.default.updateOne({ _id: user._id }, {
                isEmailVerified: true,
                myReferralCode: referralCode,
            });
        }
        else {
            yield user_model_1.default.updateOne({ _id: user._id }, { isEmailVerified: true });
        }
        yield otp_mode_1.default.deleteOne({ _id: otpRecord._id });
        const accessToken = (0, jwt_1.generateAccessToken)(user._id);
        const refreshToken = (0, jwt_1.generateRefreshToken)(user._id);
        yield token_model_1.default.create({
            userId: user._id,
            token: refreshToken,
        });
        winston_1.logger.info('Refresh token stored in database', {
            userId: user._id,
            token: refreshToken,
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config_1.default.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        res.status(200).json({
            user: {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                myReferralCode: user.myReferralCode,
                role: user.role,
            },
            accessToken,
        });
        winston_1.logger.info('Email verified and user logged in', { email: user.email });
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            status: 'error',
            timestamp: new Date().toISOString(),
        });
        winston_1.logger.error('Error verifying OTP', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            error,
        });
    }
});
exports.default = verifyOTP;
//# sourceMappingURL=verify-otp.controller.js.map