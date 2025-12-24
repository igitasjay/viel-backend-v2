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
const register_controller_1 = __importDefault(require("@/controllers/auth/register.controller"));
const login_comtroller_1 = __importDefault(require("@/controllers/auth/login.comtroller"));
const express_validator_1 = require("express-validator");
const validation_error_middleware_1 = __importDefault(require("@/middlewares/validation-error.middleware"));
const user_model_1 = __importDefault(require("@/models/user.model"));
const refresh_token_controller_1 = __importDefault(require("@/controllers/auth/refresh-token.controller"));
const logout_controller_1 = __importDefault(require("@/controllers/auth/logout.controller"));
const authenticate_middleware_1 = __importDefault(require("@/middlewares/authenticate.middleware"));
const verify_otp_controller_1 = __importDefault(require("@/controllers/auth/verify-otp.controller"));
const router = (0, express_1.default)();
router.post('/register', (0, express_validator_1.body)('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email address.')
    .custom((value) => __awaiter(void 0, void 0, void 0, function* () {
    const userExists = yield user_model_1.default.exists({ email: value });
    if (userExists) {
        throw new Error('User with this email already exists.');
    }
    return true;
})), (0, express_validator_1.body)('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'), (0, express_validator_1.body)('firstname').trim().notEmpty().withMessage('First name is required.'), (0, express_validator_1.body)('lastname').trim().notEmpty().withMessage('Last name is required.'), (0, express_validator_1.body)('role')
    .optional()
    .isString()
    .withMessage('Invalid role: must be a string.')
    .isIn(['user', 'admin'])
    .withMessage('Invalid role: must be either user or admin.'), validation_error_middleware_1.default, register_controller_1.default);
router.post('/login', (0, express_validator_1.body)('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email address.'), (0, express_validator_1.body)('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'), validation_error_middleware_1.default, login_comtroller_1.default);
router.post('/verify-otp', (0, express_validator_1.body)('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email address.'), (0, express_validator_1.body)('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits.'), validation_error_middleware_1.default, verify_otp_controller_1.default);
router.post('/refresh-token', (0, express_validator_1.cookie)('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required.')
    .isJWT()
    .withMessage('Invalid refresh token.'), validation_error_middleware_1.default, refresh_token_controller_1.default);
router.post('/logout', authenticate_middleware_1.default, logout_controller_1.default);
exports.default = router;
//# sourceMappingURL=auth.route.js.map