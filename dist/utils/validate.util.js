"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    const data = { body: req.body, query: req.query, params: req.params };
    const parsed = schema.safeParse(data);
    if (!parsed.success)
        return res
            .status(400)
            .json({ success: false, errors: parsed.error.format() });
    req.validated = parsed.data;
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.util.js.map