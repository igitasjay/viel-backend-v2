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
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserSchema = new mongoose_1.Schema({
    firstname: {
        type: String,
        required: [true, 'Your first name is required'],
        minlength: [2, 'First name must be at least 2 characters long'],
    },
    lastname: {
        type: String,
        required: [true, 'Your last name is required'],
        minlength: [2, 'Last name must be at least 2 characters long'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email already exists'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false,
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: 'Role is either user or admin',
        },
        default: 'user',
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    verifiedUser: {
        type: Boolean,
        default: false,
    },
    netTradingVolumn: {
        type: Number,
        default: 0,
    },
    passcode: {
        type: String,
    },
    nin: {
        type: String,
    },
    bvn: {
        type: String,
    },
    myReferralCode: {
        type: String,
        unique: true,
        default: () => Math.random().toString(36).substring(2, 10).toUpperCase(),
    },
    referredBy: {
        type: String,
        required: false,
    },
}, {
    timestamps: true,
});
UserSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified('password')) {
            this.password = yield bcrypt_1.default.hash(this.password, 10);
        }
        next();
    });
});
exports.default = (0, mongoose_1.model)('User', UserSchema);
//# sourceMappingURL=user.model.js.map