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
exports.getNextSequence = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("./mongoose");
const CounterSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});
const Counter = mongoose_1.default.models.Counter || mongoose_1.default.model('Counter', CounterSchema);
const getNextSequence = (name) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mongoose_2.connectToDatabase)();
    const counter = yield Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, new: true });
    return counter.seq;
});
exports.getNextSequence = getNextSequence;
//# sourceMappingURL=sequence.js.map