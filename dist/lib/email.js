"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.sendPurchaseEmail = exports.sendEmail = exports.sendVerificationEmail = void 0;
const nodemailer = __importStar(require("nodemailer"));
const config_1 = __importDefault(require("../config/config"));
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    auth: {
        user: config_1.default.EMAIL_USER,
        pass: config_1.default.EMAIL_PASS,
    },
});
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Connection Error:', error);
    }
    else {
        console.log('Server is ready to take our messages');
    }
});
const sendVerificationEmail = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: `"Viel OTP Test" <${process.env.MY_EMAIL}>`,
            to: email,
            subject: 'Email Verification OTP',
            html: `
        <h1>Email Verification</h1>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return;
    }
    catch (error) {
        console.error('Error sending email:', error.message);
        throw error;
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendEmail = (to, subject, text) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield transporter.sendMail({
            from: config_1.default.EMAIL_FROM,
            to,
            subject,
            text,
        });
    }
    catch (error) {
        console.error('Email send failed:', error);
        throw new Error('Failed to send email');
    }
});
exports.sendEmail = sendEmail;
const sendPurchaseEmail = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    yield transporter.sendMail({
        from: config_1.default.EMAIL_FROM,
        to,
        subject,
        html,
    });
});
exports.sendPurchaseEmail = sendPurchaseEmail;
//# sourceMappingURL=email.js.map