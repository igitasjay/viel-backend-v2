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
exports.getDepositWallet = exports.getSupportedCoins = void 0;
const crypto_model_1 = __importDefault(require("@/models/crypto.model"));
const twelve_data_1 = require("@/lib/twelve-data");
const winston_1 = require("@/lib/winston");
const getSupportedCoins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const assets = yield crypto_model_1.default.find({ status: 1 }).lean();
        const enriched = yield Promise.all(assets.map((asset) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const live = yield (0, twelve_data_1.fetchLiveRate)(asset.code);
            const naira_rate = ((_a = live === null || live === void 0 ? void 0 : live.ngn) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || asset.naira_rate;
            return Object.assign(Object.assign({}, asset), { naira_rate, networks: asset.networks
                    .filter((n) => n.enabled)
                    .map((n) => ({
                    id: n.id,
                    name: n.name,
                    code: n.code,
                    walletAddress: n.walletAddress,
                    qrCodeString: n.walletAddress,
                    sellingRate: naira_rate,
                    minDeposit: n.minimum,
                    fee: n.fee,
                    feeType: n.feeType,
                })) });
        })));
        res.status(200).json({
            message: 'Supported cryptocurrencies fetched.',
            data: enriched,
        });
    }
    catch (error) {
        winston_1.logger.error('Error fetching crypto list:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Failed to fetch supported coins.',
        });
    }
});
exports.getSupportedCoins = getSupportedCoins;
const getDepositWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { coin, network } = req.query;
    if (!coin || !network) {
        res.status(400).json({
            code: 'ValidationError',
            message: 'Both coin and network are required.',
        });
        return;
    }
    try {
        const asset = yield crypto_model_1.default.findOne({
            code: coin.toString().toUpperCase(),
            status: 1,
            'networks.code': network.toString().toUpperCase(),
            'networks.enabled': true,
        });
        if (!asset) {
            res.status(404).json({
                code: 'NotFound',
                message: 'Coin or network not supported.',
            });
            return;
        }
        const net = asset.networks.find((n) => n.code === network.toString().toUpperCase() && n.enabled);
        if (!net) {
            res.status(404).json({
                code: 'NotFound',
                message: 'Network not enabled.',
            });
            return;
        }
        res.status(200).json({
            message: 'Deposit wallet retrieved.',
            data: {
                coin: asset.code,
                network: net.code,
                walletAddress: net.walletAddress,
                qrCodeString: net.walletAddress,
                minDeposit: net.minimum,
                sellingRate: ((_b = (_a = (yield (0, twelve_data_1.fetchLiveRate)(asset.code))) === null || _a === void 0 ? void 0 : _a.ngn) === null || _b === void 0 ? void 0 : _b.toFixed(2)) ||
                    asset.naira_rate,
            },
        });
    }
    catch (error) {
        winston_1.logger.error('Error fetching wallet:', error);
        res.status(500).json({
            code: 'ServerError',
            message: 'Failed to retrieve wallet.',
        });
    }
});
exports.getDepositWallet = getDepositWallet;
//# sourceMappingURL=user.crypto.controller.js.map