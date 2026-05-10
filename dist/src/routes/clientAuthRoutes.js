"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientAuthController_1 = __importDefault(require("../controller/clientAuthController"));
const router = express_1.default.Router();
router.get("/verify", clientAuthController_1.default.verify);
router.get("/me", clientAuthController_1.default.getMe);
router.post("/set-password", clientAuthController_1.default.setPassword);
// Note: We name this /login, but inside authRoutes or index.ts it's mounted under /client-auth
router.post("/login", clientAuthController_1.default.login);
exports.default = router;
