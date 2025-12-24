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
exports.sendPurchaseEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config/config"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: config_1.default.EMAIL_USER,
        pass: config_1.default.EMAIL_PASS,
    },
});
const sendEmail = (to, subject, text) => __awaiter(void 0, void 0, void 0, function* () {
    yield transporter.sendMail({
        from: config_1.default.EMAIL_FROM,
        to,
        subject,
        text,
    });
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