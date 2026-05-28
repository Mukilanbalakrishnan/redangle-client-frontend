import express from "express";
import ClientQuotationController from "../controller/clientQuotationController";

const router = express.Router();

router.get("/", ClientQuotationController.getQuotations);
router.get("/addons", ClientQuotationController.getAddons);
router.patch("/:id/approve", ClientQuotationController.approveQuotation);
router.patch("/:id/reject", ClientQuotationController.rejectQuotation);
router.post("/:id/issue", ClientQuotationController.raiseIssue);

export default router;
