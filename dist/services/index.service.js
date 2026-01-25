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
exports.getNextDepositIndex = getNextDepositIndex;
const counter_model_1 = __importDefault(require("@/models/counter.model"));
function getNextDepositIndex(network) {
    return __awaiter(this, void 0, void 0, function* () {
        const counterId = `depositIndex:${network.toUpperCase()}`;
        const doc = yield counter_model_1.default.findOneAndUpdate({ _id: counterId }, { $inc: { seq: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
        return doc.seq;
    });
}
//# sourceMappingURL=index.service.js.map