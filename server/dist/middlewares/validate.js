"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body); // ensures type safety at runtime
        next();
    }
    catch (error) {
        next(error); // global error handler takes care
    }
};
exports.validate = validate;
