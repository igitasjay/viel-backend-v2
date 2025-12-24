"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const validation_error_middleware_1 = __importDefault(require("../../middlewares/validation-error.middleware"));
const authenticate_middleware_1 = __importDefault(require("../../middlewares/authenticate.middleware"));
const banks_service_1 = __importDefault(require("../../services/banks.service"));
const bank_controller_1 = __importDefault(require("../../controllers/user/bank.controller"));
const my_bank_controller_1 = __importDefault(require("../../controllers/user/my-bank.controller"));
const router = (0, express_1.default)();
router.use(authenticate_middleware_1.default);
router.get('/list', banks_service_1.default);
router.post('/add', (0, express_validator_1.body)('accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Account number is required')
    .isLength({ min: 10 }), (0, express_validator_1.body)('accountName').trim().notEmpty().withMessage('Account name is required'), (0, express_validator_1.body)('bankName').trim().notEmpty().withMessage('Bank name is required'), (0, express_validator_1.body)('bankCode').trim().notEmpty().withMessage('Bank code is required'), validation_error_middleware_1.default, bank_controller_1.default);
router.get('/my-bank', my_bank_controller_1.default);
exports.default = router;
//# sourceMappingURL=banks.route.js.map