"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET ||
        "your-super-secret-jwt-key-change-in-production",
    // <-- FIXED: removed `as const`
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10),
    DATABASE_URL: process.env.DATABASE_URL ||
        "postgresql://postgres:997662@localhost:5432/Redangle",
    EMAIL_HOST: process.env.EMAIL_HOST || "smtp.gmail.com",
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT || "587", 10),
    EMAIL_SECURE: process.env.EMAIL_SECURE === "true" || false,
    EMAIL_USER: process.env.EMAIL_USER || "noreply@redangle.com",
    EMAIL_PASS: process.env.EMAIL_PASS || "",
    EMAIL_FROM: process.env.EMAIL_FROM || "noreply@redangle.com",
    COMPANY_NAME: process.env.COMPANY_NAME || "red angle",
    COMPANY_WEBSITE: process.env.COMPANY_WEBSITE || "https://redangle.com",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
};
