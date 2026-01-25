"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("@/middlewares/upload");
const adminCtrl = __importStar(require("@/controllers/giftcard/admin.controller"));
const sellAdminCtrl = __importStar(require("@/controllers/giftcard/admin-sell.controller"));
const router = (0, express_1.Router)();
router.post('/create', upload_1.upload.single('image'), adminCtrl.createGiftCard);
router.post('/countries', adminCtrl.createCountry);
router.put('/giftcards/:id', adminCtrl.updateGiftCard);
router.post('/sell/brands', upload_1.upload.single('logo'), sellAdminCtrl.addBrand);
router.get('/sell/brands', sellAdminCtrl.listBrands);
router.post('/sell/brands/:id/countries', sellAdminCtrl.addCountry);
router.post('/sell/brands/:id/countries/:iso/ranges', sellAdminCtrl.addRange);
router.post('/sell/brands/:id/countries/:iso/ranges/:range/types', sellAdminCtrl.addType);
router.get('/sell/requests', sellAdminCtrl.listSales);
router.patch('/sell/requests/:id', sellAdminCtrl.updateSale);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map