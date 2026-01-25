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
const mongoose_1 = require("@/lib/mongoose");
const sequence_1 = require("@/lib/sequence");
const winston_1 = require("@/lib/winston");
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, mongoose_1.connectToDatabase)();
    yield (0, sequence_1.getNextSequence)('transactionId');
    winston_1.logger.info('Transaction counter initialized.');
    process.exit(0);
});
init();
//# sourceMappingURL=transaction-seeds.js.map