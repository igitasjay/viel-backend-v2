"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_crypto_controller_1 = require("@/controllers/crypto/user.crypto.controller");
const admin_crypto_controller_1 = require("@/controllers/crypto/admin.crypto.controller");
const authenticate_middleware_1 = __importDefault(require("@/middlewares/authenticate.middleware"));
const role_check_middleware_1 = require("@/middlewares/role-check.middleware");
const deposit_controller_1 = require("@/controllers/crypto/deposit.controller");
const router = (0, express_1.Router)();
router.use(authenticate_middleware_1.default);
router.get('/coins', user_crypto_controller_1.getSupportedCoins);
router.get('/wallet', user_crypto_controller_1.getDepositWallet);
router.get('/request', deposit_controller_1.requestDepositAddress);
router.post('/admin', role_check_middleware_1.isAdmin, admin_crypto_controller_1.createCrypto);
router.put('/admin/:id', role_check_middleware_1.isAdmin, admin_crypto_controller_1.updateCrypto);
router.delete('/admin/:id', role_check_middleware_1.isAdmin, admin_crypto_controller_1.deleteCrypto);
exports.default = router;
//# sourceMappingURL=crypto.route.js.map