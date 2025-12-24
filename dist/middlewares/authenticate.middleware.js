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
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("@/lib/winston");
const jsonwebtoken_1 = require("jsonwebtoken");
const jwt_1 = require("@/lib/jwt");
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            code: 'AuthenticationError',
            message: 'Access denied: no token provided.',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const jwtPayload = (0, jwt_1.verifyAccessToken)(token);
        req.userId = jwtPayload.userId;
        return next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            res.status(401).json({
                code: 'TokenExpiredError',
                message: 'Access denied: token has expired.',
                error: error,
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            res.status(401).json({
                code: 'JsonWebTokenError',
                message: 'Access denied: invalid token.',
            });
            return;
        }
        res.status(500).json({
            code: 'InternalServerError',
            message: 'An internal server error occurred during authentication.',
        });
        winston_1.logger.error('Error during authentication middleware.', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            error,
        });
        return;
    }
});
exports.default = authenticate;
//# sourceMappingURL=authenticate.middleware.js.map