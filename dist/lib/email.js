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
exports.sendForgotPasswordEmail = exports.sendVerificationEmail = void 0;
const config_1 = __importDefault(require("@/config/config"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const resend_1 = require("resend");
const resend = new resend_1.Resend(config_1.default.RESEND_API_KEY);
const sendVerificationEmail = (email, firstname, otp) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('send mail called');
    try {
        const info = yield resend.emails.send({
            from: 'VIEL Auth <info@myviel.com>',
            to: email,
            subject: `Hello ${firstname},`,
            html: '<p>Your OTP for email verification is: <strong>' +
                'V-' +
                otp +
                '</strong>. It expires in 10 minutes.</p>',
        });
        console.log('Email sent:', info.data);
        return;
    }
    catch (error) {
        console.error('Error sending email:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw error;
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendForgotPasswordEmail = (email, firstname, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const info = yield resend.emails.send({
            from: 'VIEL Auth <info@myviel.com>',
            to: email,
            subject: 'Reset Your Password',
            html: `
        <p>Hello ${firstname},</p>
        <p>You requested to reset your password. Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      `,
        });
        console.log('Forgot password email sent:', info.data);
        return;
    }
    catch (error) {
        console.error('Error sending forgot password email:', error);
        throw error;
    }
});
exports.sendForgotPasswordEmail = sendForgotPasswordEmail;
//# sourceMappingURL=email.js.map