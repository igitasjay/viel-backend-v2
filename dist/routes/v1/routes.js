"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("@/routes/v1/auth.route"));
const user_route_1 = __importDefault(require("@/routes/v1/user.route"));
const banks_route_1 = __importDefault(require("@/routes/v1/banks.route"));
const charge_route_1 = __importDefault(require("@/routes/v1/charge.route"));
const deposit_route_1 = __importDefault(require("@/crypto/routes/deposit.route"));
const admin_routes_1 = __importDefault(require("@/routes/v1/admin.routes"));
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.status(200).json({
        message: 'API is live!!',
        status: 'ok',
        version: '1.0.0',
        docs: '/docs',
        timestamp: new Date().toISOString(),
    });
});
router.use('/auth', auth_route_1.default);
router.use('/users', user_route_1.default);
router.use('/banks', banks_route_1.default);
router.use('/charge', charge_route_1.default);
router.use('/crypto', deposit_route_1.default);
router.use('/admin/giftcard', admin_routes_1.default);
exports.default = router;
//# sourceMappingURL=routes.js.map