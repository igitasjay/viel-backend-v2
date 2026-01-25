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
exports.sendVerificationEmail = void 0;
const config_1 = __importDefault(require("@/config/config"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const resend_1 = require("resend");
const resend = new resend_1.Resend(config_1.default.RESEND_API_KEY);
const sendVerificationEmail = (email, firstname, otp) => __awaiter(void 0, void 0, void 0, function* () {
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
        console.error('Error sending email:', error.response.data);
        console.error('Error sending email:', error.message);
        throw error;
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
//# sourceMappingURL=email.js.map