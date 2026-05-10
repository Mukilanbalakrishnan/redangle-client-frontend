"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientDeliveryController_1 = require("../controller/clientDeliveryController");
const router = express_1.default.Router();
router.get('/', clientDeliveryController_1.getClientDeliveries);
router.patch('/:deliveryId/approve', clientDeliveryController_1.approveClientDelivery);
router.post('/:deliveryId/query', clientDeliveryController_1.raiseClientQuery);
exports.default = router;
