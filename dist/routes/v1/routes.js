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
const express_1 = require("express");
const auth_route_1 = __importDefault(require("@/routes/v1/auth.route"));
const user_route_1 = __importDefault(require("@/routes/v1/user.route"));
const banks_route_1 = __importDefault(require("@/routes/v1/banks.route"));
const charge_route_1 = __importDefault(require("@/routes/v1/charge.route"));
const admin_routes_1 = __importDefault(require("@/routes/v1/admin.routes"));
const authorisation_route_1 = __importDefault(require("@/routes/v1/authorisation.route"));
const redis_config_1 = __importDefault(require("@/config/redis.config"));
const wallet_routes_1 = __importDefault(require("../../crypto-infra/routes/wallet.routes"));
const webhook_routes_1 = __importDefault(require("../../crypto-infra/routes/webhook.routes"));
const admin_routes_2 = __importDefault(require("../../crypto-infra/routes/admin.routes"));
const authenticate_middleware_1 = __importDefault(require("@/middlewares/authenticate.middleware"));
const crypto_routes_1 = __importDefault(require("../../crypto-infra/routes/crypto.routes"));
const giftcard_route_1 = __importDefault(require("@/routes/v1/giftcard.route"));
const transaction_route_1 = __importDefault(require("@/routes/v1/transaction.route"));
const monnify_route_1 = __importDefault(require("@/routes/v1/monnify.route"));
const monnify_webhook_1 = require("@/controllers/monnify.webhook");
const verification_controller_1 = require("@/controllers/verification.controller");
const router = (0, express_1.Router)();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        message: 'API is live!!',
        status: 'ok',
        version: '1.0.0',
        docs: '/docs',
        timestamp: new Date().toISOString(),
    });
}));
router.post('/red', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = req.body;
    const client = yield (0, redis_config_1.default)();
    res.send('redis thing');
}));
router.use('/auth', auth_route_1.default);
router.use('/users', user_route_1.default);
router.use('/banks', banks_route_1.default);
router.use('/charge', charge_route_1.default);
router.use('/giftcard', giftcard_route_1.default);
router.use('/admin/giftcard', admin_routes_1.default);
router.use('/authorisation', authorisation_route_1.default);
router.use('/transactions', transaction_route_1.default);
router.use('/monnify', monnify_route_1.default);
router.post('/monnify/webhook', monnify_webhook_1.handleMonnifyWebhook);
router.post('/transactions/:reference/verify', verification_controller_1.verifyTransactionStatus);
router.use(authenticate_middleware_1.default);
router.use('/infra/admin', admin_routes_2.default);
router.use('/infra/wallets', wallet_routes_1.default);
router.use('/infra/webhooks', webhook_routes_1.default);
router.use('/infra/crypto', crypto_routes_1.default);
exports.default = router;
//# sourceMappingURL=routes.js.map