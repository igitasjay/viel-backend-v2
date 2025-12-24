"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CountrySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
});
CountrySchema.virtual('flag').get(function () {
    return `https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/${this.code.toUpperCase()}.svg`;
});
CountrySchema.set('toJSON', { virtuals: true });
CountrySchema.set('toObject', { virtuals: true });
const Country = (0, mongoose_1.model)('Country', CountrySchema);
exports.default = Country;
//# sourceMappingURL=country.model.js.map