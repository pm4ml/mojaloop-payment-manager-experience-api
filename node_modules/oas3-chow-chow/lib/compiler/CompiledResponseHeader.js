"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CompiledSchema_1 = require("./CompiledSchema");
const error_1 = require("../error");
class CompiledResponseHeader {
    constructor(headers = {}, options) {
        this.headerSchema = {
            type: 'object',
            properties: {},
            required: [],
        };
        /**
         * If a response header is defined with the name "Content-Type", it SHALL be ignored.
         */
        this.ignoreHeaders = ['Content-Type'];
        for (const name in headers) {
            if (this.ignoreHeaders.includes(name)) {
                continue;
            }
            const headerNameLower = name.toLowerCase();
            const header = headers[name];
            if (header.schema) {
                this.headerSchema.properties[headerNameLower] = header.schema;
            }
            if (header.required) {
                this.headerSchema.required.push(headerNameLower);
            }
        }
        this.compiledSchema = new CompiledSchema_1.default(this.headerSchema, options.headerAjvOptions || {});
    }
    validate(header = {}) {
        try {
            // Before validation, lowercase the header name, since header name is also lowercased in compiledSchema
            const newHeader = Object.entries(header).reduce((newObject, [key, value]) => {
                newObject[key.toLowerCase()] = value;
                return newObject;
            }, {});
            this.compiledSchema.validate(newHeader);
        }
        catch (e) {
            throw new error_1.default('Schema validation error', {
                in: 'response-header',
                rawErrors: e,
            });
        }
    }
}
exports.default = CompiledResponseHeader;
//# sourceMappingURL=CompiledResponseHeader.js.map