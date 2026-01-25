"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const winston_1 = require("@/lib/winston");
const isAdmin = (req, res, next) => {
    var _a;
    if (!req.userId) {
        res.status(401).json({
            code: 'Unauthorized',
            message: 'Authentication required.',
        });
        return;
    }
    const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    if (userRole !== 'admin') {
        winston_1.logger.warn('Unauthorized admin access attempt', {
            userId: req.userId,
            role: userRole,
            path: req.originalUrl,
            ip: req.ip,
        });
        res.status(403).json({
            code: 'Forbidden',
            message: 'Admin access required.',
        });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=role-check.middleware.js.map