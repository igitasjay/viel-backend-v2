"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deposit_controller_1 = require("../controllers/deposit.controller");
const authenticate_middleware_1 = __importDefault(require("@/middlewares/authenticate.middleware"));
const router = (0, express_1.Router)();
router.use(authenticate_middleware_1.default);
router.post('/address', deposit_controller_1.allocateAddress);
router.get('/tx/:txHash', deposit_controller_1.getDeposit);
router.get('/user/:userId', deposit_controller_1.listUserDeposits);
exports.default = router;
//# sourceMappingURL=deposit.route.js.map