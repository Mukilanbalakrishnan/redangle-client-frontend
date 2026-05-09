"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clientQuotationController_1 = __importDefault(require("../controller/clientQuotationController"));
const router = express_1.default.Router();
router.get("/", clientQuotationController_1.default.getQuotations);
router.patch("/:id/approve", clientQuotationController_1.default.approveQuotation);
router.patch("/:id/reject", clientQuotationController_1.default.rejectQuotation);
router.post("/:id/issue", clientQuotationController_1.default.raiseIssue);
exports.default = router;
