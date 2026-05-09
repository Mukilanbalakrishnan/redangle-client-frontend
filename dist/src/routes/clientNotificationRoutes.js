"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientNotificationController_1 = require("../controller/clientNotificationController");
const auth_1 = require("../util/auth");
const router = express_1.default.Router();
// Get dynamically generated client notifications
router.get('/', auth_1.verifyClientToken, clientNotificationController_1.getClientNotifications);
exports.default = router;
