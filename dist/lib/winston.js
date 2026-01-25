"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("@/config/config"));
const { combine, timestamp, json, errors, align, printf, colorize } = winston_1.default.format;
const transports = [];
if (config_1.default.NODE_ENV !== 'production') {
    transports.push(new winston_1.default.transports.Console({
        format: combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), align(), printf((_a) => {
            var { timestamp, level, message } = _a, meta = __rest(_a, ["timestamp", "level", "message"]);
            const metaString = Object.keys(meta).length
                ? `\n${JSON.stringify(meta)}`
                : '';
            return `${timestamp} [${level}]: ${message} ${metaString}`;
        })),
    }));
}
const logger = winston_1.default.createLogger({
    level: config_1.default.LOG_LEVEL || 'info',
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports,
    silent: config_1.default.NODE_ENV === 'test',
});
exports.logger = logger;
//# sourceMappingURL=winston.js.map