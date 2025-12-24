"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_middleware_1 = __importDefault(require("../../middlewares/authenticate.middleware"));
const fiat_controller_1 = require("../../controllers/fiat/fiat.controller");
const router = (0, express_1.Router)();
router.post('/buy-crypto', authenticate_middleware_1.default, fiat_controller_1.initializeBuyCrypto);
router.get('/verify/:reference', fiat_controller_1.verifyPayment);
exports.default = router;
//# sourceMappingURL=fiat.route.js.map