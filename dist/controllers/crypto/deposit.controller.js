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
exports.requestDepositAddress = void 0;
const deposit_address_model_1 = __importDefault(require("../../models/deposit-address.model"));
const crypto_model_1 = __importDefault(require("../../models/crypto.model"));
const hd_wallet_service_1 = require("../../services/hd-wallet.service");
const index_service_1 = require("../../services/index.service");
const twelve_data_1 = require("../../lib/twelve-data");
const requestDepositAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { coin, network } = req.query;
    const userId = req.user.id;
    if (!coin || !network) {
        return res
            .status(400)
            .json({ code: 'MISSING_PARAMS', message: 'coin & network required' });
    }
    const upperCoin = coin.toString().toUpperCase();
    const upperNet = network.toString().toUpperCase();
    const asset = yield crypto_model_1.default.findOne({
        code: upperCoin,
        status: 1,
        'networks.code': upperNet,
        'networks.enabled': true,
    });
    if (!asset) {
        return res
            .status(404)
            .json({ code: 'NOT_SUPPORTED', message: 'Coin/network not available' });
    }
    const net = asset.networks.find((n) => n.code === upperNet && n.enabled);
    if (!net) {
        return res
            .status(404)
            .json({ code: 'NETWORK_DISABLED', message: 'Network disabled' });
    }
    const index = yield (0, index_service_1.getNextDepositIndex)(upperNet);
    const { address, path } = (0, hd_wallet_service_1.deriveEVMAddress)(upperNet, index);
    const deposit = yield deposit_address_model_1.default.create({
        user: userId,
        coin: upperCoin,
        network: upperNet,
        address,
        path,
        index,
        status: 'active',
    });
    const live = yield (0, twelve_data_1.fetchLiveRate)(upperCoin);
    const sellingRate = ((_a = live === null || live === void 0 ? void 0 : live.ngn) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || asset.naira_rate;
    res.status(200).json({
        message: 'Deposit address generated',
        data: {
            coin: upperCoin,
            network: upperNet,
            walletAddress: address,
            qrCodeString: `ethereum:${address}`,
            minDeposit: net.minimum,
            fee: net.fee,
            feeType: net.feeType,
            sellingRate,
            expiresIn: '24h',
        },
    });
});
exports.requestDepositAddress = requestDepositAddress;
//# sourceMappingURL=deposit.controller.js.map