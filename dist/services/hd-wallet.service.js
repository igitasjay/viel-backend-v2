"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveEVMAddress = deriveEVMAddress;
exports.getSignerForIndex = getSignerForIndex;
exports.getProvider = getProvider;
const ethers_1 = require("ethers");
const winston_1 = require("@/lib/winston");
const config_1 = __importDefault(require("@/config/config"));
const EVM_COIN_TYPE = 60;
let masterNode = null;
function getMasterNode() {
    var _a, _b, _c;
    if (masterNode)
        return masterNode;
    const mnemonic = (_a = process.env.HD_MASTER_MNEMONIC) === null || _a === void 0 ? void 0 : _a.trim();
    const passphrase = (_c = (_b = process.env.HD_PASSPHRASE) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '';
    if (!mnemonic) {
        winston_1.logger.error('HD_MASTER_MNEMONIC is not set in .env');
        throw new Error('HD wallet seed missing');
    }
    try {
        masterNode = ethers_1.ethers.HDNodeWallet.fromPhrase(mnemonic, passphrase);
        winston_1.logger.info('HD master node loaded');
        return masterNode;
    }
    catch (err) {
        winston_1.logger.error('Invalid HD mnemonic', err);
        throw new Error('Failed to load HD wallet');
    }
}
function deriveEVMAddress(network, index) {
    const normalized = network.toUpperCase();
    const path = `m/44'/${EVM_COIN_TYPE}'/0'/0/${index}`;
    const child = getMasterNode().derivePath(path);
    return {
        address: child.address,
        path,
    };
}
function getSignerForIndex(index) {
    const path = `m/44'/${EVM_COIN_TYPE}'/0'/0/${index}`;
    const child = getMasterNode().derivePath(path);
    return new ethers_1.ethers.Wallet(child.privateKey, getProvider());
}
let sharedProvider = null;
function getProvider() {
    if (sharedProvider)
        return sharedProvider;
    const url = `https://eth-mainnet.g.alchemy.com/v2/${config_1.default.ALCHEMY_API_KEY}`;
    sharedProvider = new ethers_1.ethers.JsonRpcProvider(url);
    return sharedProvider;
}
//# sourceMappingURL=hd-wallet.service.js.map