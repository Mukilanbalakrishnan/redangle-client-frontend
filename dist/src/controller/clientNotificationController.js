"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientNotifications = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getClientNotifications = async (req, res) => {
    try {
        // Authenticated client payload
        const payload = req.user;
        if (!payload || !payload.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const leadId = Number(payload.id);
        const lead = await prisma_1.default.leadsDetail.findUnique({
            where: { leadId },
            include: {
                events: true,
                leadEmployee: true,
                invoices: true,
                quotationLeads: true,
            }
        });
        if (!lead) {
            return res.json({ success: true, data: [] });
        }
        const notifications = [];
        let idCounter = 1;
        // 1. Welcome Notification
        notifications.push({
            id: leadId * 1000 + idCounter++,
            type: 'client',
            title: 'Welcome to Red Angle Studio!',
            detail: 'Your project has been successfully registered. You can track your progress here.',
            created_at: lead.createdTime ? lead.createdTime.toISOString() : new Date().toISOString(),
            is_read: false
        });
        // 2. Quotation
        if (lead.quotationLeads && lead.quotationLeads.length > 0) {
            const quote = lead.quotationLeads[0];
            notifications.push({
                id: leadId * 1002 + idCounter++,
                type: 'assignment',
                title: 'New Quotation Available',
                detail: `A quotation has been prepared for your event.`,
                created_at: quote.createdAt ? quote.createdAt.toISOString() : new Date().toISOString(),
                is_read: false
            });
        }
        // 3. Stage changes
        if (lead.currentStage === 'Finalised') {
            notifications.push({
                id: leadId * 1005 + idCounter++,
                type: 'assignment_accepted',
                title: 'Project Finalised',
                detail: 'Production has officially started for your project!',
                created_at: new Date().toISOString(), // Since we don't have stage change history, use a recent date or just relative
                is_read: false
            });
        }
        // 4. Invoices
        if (lead.invoices && lead.invoices.length > 0) {
            lead.invoices.forEach((inv) => {
                notifications.push({
                    id: leadId * 10000 + inv.invoiceId,
                    type: 'delivery',
                    title: `Invoice Generated (${inv.type})`,
                    detail: `An invoice for ${inv.currency}${inv.totalValue} has been generated.`,
                    created_at: inv.invoiceDate ? inv.invoiceDate.toISOString() : new Date().toISOString(),
                    is_read: false
                });
                if (inv.paymentStatus === 'paid') {
                    notifications.push({
                        id: leadId * 20000 + inv.invoiceId,
                        type: 'assignment_accepted',
                        title: `Payment Received`,
                        detail: `We have received payment for Invoice ${inv.type}. Thank you!`,
                        created_at: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
                        is_read: false
                    });
                }
            });
        }
        // 5. Events Completed
        if (lead.events && lead.events.length > 0) {
            lead.events.forEach((e) => {
                if (e.status === 'completed' || e.status === 'approved') {
                    notifications.push({
                        id: leadId * 30000 + e.eventId,
                        type: 'shoot',
                        title: `Event Completed: ${e.eventName}`,
                        detail: `The shoot for ${e.eventName} has been successfully completed.`,
                        created_at: new Date().toISOString(),
                        is_read: false
                    });
                }
            });
        }
        // Sort descending by created_at (simulate newer first)
        notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        console.error('Error fetching client notifications:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getClientNotifications = getClientNotifications;
