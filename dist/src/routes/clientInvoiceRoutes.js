"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientInvoiceController_1 = __importDefault(require("../controller/clientInvoiceController"));
const router = express_1.default.Router();
router.get("/", clientInvoiceController_1.default.getInvoices);
router.post("/:id/issue", clientInvoiceController_1.default.raiseIssue);
exports.default = router;
