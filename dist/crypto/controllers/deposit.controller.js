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
exports.allocateAddress = allocateAddress;
exports.getDeposit = getDeposit;
exports.listUserDeposits = listUserDeposits;
const deposit_address_1 = require("@/crypto/models/deposit-address");
const deposit_1 = require("@/crypto/models/deposit");
function generateDepositAddressForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const fake = '0x' + Math.random().toString(16).slice(2).padEnd(40, '0');
        return fake;
    });
}
function allocateAddress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { chain = 'ethereum' } = req.body;
        const userId = req.userId;
        if (!userId)
            return res.status(400).json({ error: 'userId required' });
        const address = yield generateDepositAddressForUser(userId.toString());
        const doc = yield deposit_address_1.DepositAddress.create({ userId, address, chain });
        return res.status(201).json({ address: doc.address, id: doc._id });
    });
}
function getDeposit(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { txHash } = req.params;
        const deposit = yield deposit_1.Deposit.findOne({ txHash });
        if (!deposit)
            return res.status(404).json({ error: 'not found' });
        return res.json(deposit);
    });
}
function listUserDeposits(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const deposits = yield deposit_1.Deposit.find({ userId })
            .sort({ firstSeenAt: -1 })
            .limit(100);
        return res.json(deposits);
    });
}
//# sourceMappingURL=deposit.controller.js.map