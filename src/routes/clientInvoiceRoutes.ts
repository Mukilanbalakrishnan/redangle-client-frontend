import express from "express";
import ClientInvoiceController from "../controller/clientInvoiceController";

const router = express.Router();

router.get("/", ClientInvoiceController.getInvoices);
router.post("/:id/issue", ClientInvoiceController.raiseIssue);

export default router;
