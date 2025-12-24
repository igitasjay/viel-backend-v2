"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const validationError = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            code: 'ValidationError',
            errors: errors.mapped(),
        });
        return;
    }
    next();
};
exports.default = validationError;
//# sourceMappingURL=validation-error.middleware.js.map