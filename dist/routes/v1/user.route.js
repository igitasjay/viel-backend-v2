"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_middleware_1 = __importDefault(require("@/middlewares/authenticate.middleware"));
const authorize_middleware_1 = __importDefault(require("@/middlewares/authorize.middleware"));
const get_current_user_1 = __importDefault(require("@/controllers/user/get-current-user"));
const update_current_user_1 = __importDefault(require("@/controllers/user/update-current-user"));
const router = (0, express_1.default)();
router.get('/current', authenticate_middleware_1.default, (0, authorize_middleware_1.default)(['user', 'admin']), get_current_user_1.default);
router.put('/current', authenticate_middleware_1.default, (0, authorize_middleware_1.default)(['user', 'admin']), update_current_user_1.default);
exports.default = router;
//# sourceMappingURL=user.route.js.map