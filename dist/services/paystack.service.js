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
exports.chargeBankAccount = chargeBankAccount;
exports.submitOtp = submitOtp;
const https_1 = __importDefault(require("https"));
const PAYSTACK_API_URL = 'api.paystack.co';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
function chargeBankAccount(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!PAYSTACK_SECRET_KEY) {
            throw new Error('PAYSTACK_SECRET_KEY not set in environment');
        }
        console.log('Paystack request payload:', JSON.stringify(payload, null, 2));
        const requestBody = JSON.stringify(payload);
        const contentLength = Buffer.byteLength(requestBody);
        const options = {
            hostname: PAYSTACK_API_URL,
            port: 443,
            path: '/charge',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': contentLength,
            },
        };
        console.log('Paystack https request:', {
            body: requestBody,
            headers: options.headers,
        });
        return new Promise((resolve, reject) => {
            const req = https_1.default.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode && res.statusCode >= 400) {
                            const error = new Error('Paystack charge failed');
                            error.paystackResponse = response;
                            error.status = res.statusCode;
                            reject(error);
                        }
                        else {
                            resolve(response);
                        }
                    }
                    catch (error) {
                        reject(new Error('Failed to parse Paystack response'));
                    }
                });
            });
            req.on('error', (error) => {
                console.error('Paystack API error:', error.message);
                reject(error);
            });
            req.write(requestBody);
            req.end();
        });
    });
}
function submitOtp(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!PAYSTACK_SECRET_KEY) {
            throw new Error('PAYSTACK_SECRET_KEY not set in environment');
        }
        console.log('Paystack OTP request payload:', JSON.stringify(payload, null, 2));
        const requestBody = JSON.stringify(payload);
        const contentLength = Buffer.byteLength(requestBody);
        const options = {
            hostname: PAYSTACK_API_URL,
            port: 443,
            path: '/charge/submit_otp',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': contentLength,
            },
        };
        console.log('Paystack OTP https request:', {
            body: requestBody,
            headers: options.headers,
        });
        return new Promise((resolve, reject) => {
            const req = https_1.default.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (res.statusCode && res.statusCode >= 400) {
                            const error = new Error('Paystack OTP submission failed');
                            error.paystackResponse = response;
                            error.status = res.statusCode;
                            reject(error);
                        }
                        else {
                            resolve(response);
                        }
                    }
                    catch (error) {
                        reject(new Error('Failed to parse Paystack response'));
                    }
                });
            });
            req.on('error', (error) => {
                console.error('Paystack OTP API error:', error.message);
                reject(error);
            });
            req.write(requestBody);
            req.end();
        });
    });
}
//# sourceMappingURL=paystack.service.js.map