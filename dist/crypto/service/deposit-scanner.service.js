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
exports.startScanner = startScanner;
const ethers_1 = require("ethers");
const deposit_1 = require("../models/deposit");
const deposit_address_1 = require("../models/deposit-address");
const config_1 = __importDefault(require("../../config/config"));
const RPC_URL = config_1.default.RPC_URL || '';
const REQUIRED_CONFIRMATIONS = Number(process.env.REQUIRED_CONFIRMATIONS || 3);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 5000);
const provider = new ethers_1.JsonRpcProvider(RPC_URL);
const lastProcessed = {};
function getLastProcessedBlock(chain) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        return (_a = lastProcessed[chain]) !== null && _a !== void 0 ? _a : (yield provider.getBlockNumber()) - 1;
    });
}
function setLastProcessedBlock(chain, n) {
    return __awaiter(this, void 0, void 0, function* () {
        lastProcessed[chain] = n;
    });
}
function processBlock(chain, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const block = yield provider.getBlock(blockNumber, true);
        if (!block)
            return;
        const addresses = yield deposit_address_1.DepositAddress.find({ chain }).lean();
        const addrSet = new Set(addresses.map((a) => a.address.toLowerCase()));
        for (const txHash of block.transactions) {
            const tx = yield provider.getTransaction(txHash);
            if (!tx || !tx.to)
                continue;
            const toLower = tx.to.toLowerCase();
            if (!addrSet.has(toLower))
                continue;
            try {
                yield deposit_1.Deposit.updateOne({ txHash }, {
                    $setOnInsert: {
                        address: tx.to,
                        txHash,
                        from: (_a = tx.from) !== null && _a !== void 0 ? _a : null,
                        to: tx.to,
                        chain,
                        tokenAddress: null,
                        amountWei: tx.value.toString(),
                        blockNumber: tx.blockNumber,
                        confirmations: 1,
                        status: 'pending',
                        firstSeenAt: new Date(),
                        lastUpdatedAt: new Date(),
                    },
                }, { upsert: true });
            }
            catch (_b) { }
        }
        const transferTopic = ethers_1.ethers.id('Transfer(address,address,uint256)');
        for (const a of addresses) {
            const filter = {
                fromBlock: blockNumber,
                toBlock: blockNumber,
                topics: [transferTopic, null, ethers_1.ethers.zeroPadValue(a.address, 32)],
            };
            try {
                const logs = yield provider.getLogs(filter);
                for (const log of logs) {
                    const amount = ethers_1.ethers.toBigInt(log.data).toString();
                    const tokenAddress = log.address;
                    const txHash = log.transactionHash;
                    yield deposit_1.Deposit.updateOne({ txHash }, {
                        $setOnInsert: {
                            address: a.address,
                            txHash,
                            from: null,
                            to: a.address,
                            chain,
                            tokenAddress,
                            amountWei: amount,
                            blockNumber: log.blockNumber,
                            confirmations: 1,
                            status: 'pending',
                            firstSeenAt: new Date(),
                            lastUpdatedAt: new Date(),
                        },
                    }, { upsert: true });
                }
            }
            catch (e) {
                console.error('token log query failed', e);
            }
        }
    });
}
function updateConfirmations(chain, currentBlock) {
    return __awaiter(this, void 0, void 0, function* () {
        const pending = yield deposit_1.Deposit.find({ chain, status: 'pending' });
        for (const d of pending) {
            if (!d.blockNumber)
                continue;
            const conf = currentBlock - d.blockNumber + 1;
            if (conf !== d.confirmations) {
                d.confirmations = conf;
                d.lastUpdatedAt = new Date();
                if (conf >= REQUIRED_CONFIRMATIONS) {
                    d.status = 'confirmed';
                    yield d.save();
                    yield creditUser(d);
                }
                else {
                    yield d.save();
                }
            }
        }
    });
}
function creditUser(d) {
    return __awaiter(this, void 0, void 0, function* () {
        const addrDoc = yield deposit_address_1.DepositAddress.findOne({
            address: d.address,
            chain: d.chain,
        });
        if (!addrDoc) {
            console.warn('No user mapping for address', d.address);
            return;
        }
        yield deposit_1.Deposit.updateOne({ txHash: d.txHash, status: 'confirmed' }, { $set: { status: 'credited' } });
        console.log(`Credited ${d.amountWei} (wei) to user ${addrDoc.userId}`);
    });
}
function startScanner() {
    return __awaiter(this, arguments, void 0, function* (chain = 'ethereum') {
        let last = yield getLastProcessedBlock(chain);
        const head = yield provider.getBlockNumber();
        if (last < head - 100)
            last = head - 100;
        yield setLastProcessedBlock(chain, last);
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const current = yield provider.getBlockNumber();
                for (let bn = last + 1; bn <= current; bn++) {
                    yield processBlock(chain, bn);
                    yield setLastProcessedBlock(chain, bn);
                    last = bn;
                }
                yield updateConfirmations(chain, current);
            }
            catch (err) {
                console.error('scanner loop error', err);
            }
        }), POLL_INTERVAL_MS);
    });
}
//# sourceMappingURL=deposit-scanner.service.js.map