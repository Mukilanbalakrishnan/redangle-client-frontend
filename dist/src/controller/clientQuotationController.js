"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientQuotationController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_1 = require("../util/auth");
class ClientQuotationController {
    // GET /api/quotations - fetch all quotations sent to this client
    static async getQuotations(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ success: false, message: "Missing token" });
            }
            const token = authHeader.split(" ")[1];
            const payload = (0, auth_1.verifyClientToken)(token);
            const leadId = Number(payload.id);
            const quotationLeads = await prisma_1.default.quotationLead.findMany({
                where: { leadId },
                include: {
                    quotation: {
                        include: {
                            combo: true,
                        },
                    },
                },
                orderBy: { sentAt: "desc" },
            });
            // Also fetch the lead itself for event details
            const lead = await prisma_1.default.leadsDetail.findUnique({
                where: { leadId },
                select: {
                    leadId: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    eventType: true,
                    eventDate: true,
                    budget: true,
                    discount: true,
                    address: true,
                },
            });
            const result = quotationLeads.map((ql) => {
                const q = ql.quotation;
                let parsedItems = [];
                if (q.items) {
                    try {
                        parsedItems = Array.isArray(q.items) ? q.items : JSON.parse(q.items);
                    }
                    catch {
                        parsedItems = [];
                    }
                }
                return {
                    quotationLeadId: ql.id,
                    quotationId: q.id,
                    status: ql.status,
                    sentAt: ql.sentAt,
                    notes: ql.notes,
                    token: ql.token,
                    serviceName: q.serviceName,
                    serviceProvided: q.serviceProvided,
                    description: q.description,
                    quantity: q.quantity,
                    price: q.price,
                    terms: q.terms,
                    combo: q.combo?.comboName ?? null,
                    imageUrl: q.imageUrl,
                    items: parsedItems,
                    lead: lead,
                };
            });
            return res.status(200).json({ success: true, data: result });
        }
        catch (e) {
            return res.status(500).json({ success: false, message: e.message });
        }
    }
    // PATCH /api/quotations/:id/approve
    static async approveQuotation(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ success: false, message: "Missing token" });
            }
            const token = authHeader.split(" ")[1];
            const payload = (0, auth_1.verifyClientToken)(token);
            const leadId = Number(payload.id);
            const quotationLeadId = Number(req.params.id);
            // Verify this quotation belongs to this client
            const ql = await prisma_1.default.quotationLead.findFirst({
                where: { id: quotationLeadId, leadId },
            });
            if (!ql) {
                return res.status(404).json({ success: false, message: "Quotation not found" });
            }
            if (ql.status !== "pending" && ql.status !== "sent") {
                return res.status(400).json({ success: false, message: "Quotation cannot be approved in its current state" });
            }
            await prisma_1.default.quotationLead.update({
                where: { id: quotationLeadId },
                data: { status: "approved" },
            });
            // Advance lead to Confirmation stage
            await prisma_1.default.leadsDetail.update({
                where: { leadId },
                data: { currentStage: "Confirmation" },
            });
            return res.status(200).json({ success: true, message: "Quotation approved successfully" });
        }
        catch (e) {
            return res.status(500).json({ success: false, message: e.message });
        }
    }
    // PATCH /api/quotations/:id/reject
    static async rejectQuotation(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ success: false, message: "Missing token" });
            }
            const token = authHeader.split(" ")[1];
            const payload = (0, auth_1.verifyClientToken)(token);
            const leadId = Number(payload.id);
            const quotationLeadId = Number(req.params.id);
            const ql = await prisma_1.default.quotationLead.findFirst({
                where: { id: quotationLeadId, leadId },
            });
            if (!ql) {
                return res.status(404).json({ success: false, message: "Quotation not found" });
            }
            await prisma_1.default.quotationLead.update({
                where: { id: quotationLeadId },
                data: { status: "rejected" },
            });
            return res.status(200).json({ success: true, message: "Quotation rejected" });
        }
        catch (e) {
            return res.status(500).json({ success: false, message: e.message });
        }
    }
    // POST /api/quotations/:id/issue - raise a query/issue on a quotation
    static async raiseIssue(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ success: false, message: "Missing token" });
            }
            const token = authHeader.split(" ")[1];
            const payload = (0, auth_1.verifyClientToken)(token);
            const leadId = Number(payload.id);
            const quotationLeadId = Number(req.params.id);
            const { issueTitle, description } = req.body;
            if (!issueTitle) {
                return res.status(400).json({ success: false, message: "Issue title is required" });
            }
            const ql = await prisma_1.default.quotationLead.findFirst({
                where: { id: quotationLeadId, leadId },
            });
            if (!ql) {
                return res.status(404).json({ success: false, message: "Quotation not found" });
            }
            const issue = await prisma_1.default.quotationLeadIssues.create({
                data: {
                    quotationLeadId,
                    issueTitle,
                    description: description || null,
                    status: "Open",
                },
            });
            return res.status(201).json({ success: true, data: issue, message: "Query raised successfully" });
        }
        catch (e) {
            return res.status(500).json({ success: false, message: e.message });
        }
    }
}
exports.ClientQuotationController = ClientQuotationController;
exports.default = ClientQuotationController;
