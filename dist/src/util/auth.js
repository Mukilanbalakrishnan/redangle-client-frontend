"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = exports.verifyClientToken = exports.generateClientToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../config/env");
const generateClientToken = (payload) => {
    return jsonwebtoken_1.default.sign({ ...payload, role: 'client' }, env_1.ENV.JWT_SECRET, {
        expiresIn: "30d",
    });
};
exports.generateClientToken = generateClientToken;
const verifyClientToken = (token) => {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.ENV.JWT_SECRET);
        if (payload.role !== 'client') {
            throw new Error('Invalid token type');
        }
        return payload;
    }
    catch (error) {
        throw new Error("Invalid token");
    }
};
exports.verifyClientToken = verifyClientToken;
const hashPassword = async (password) => {
    return await bcryptjs_1.default.hash(password, env_1.ENV.BCRYPT_SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    return await bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
