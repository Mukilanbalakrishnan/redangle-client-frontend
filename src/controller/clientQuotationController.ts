import { Request, Response } from "express";
import prisma from "../config/prisma";
import { verifyClientToken } from "../util/auth";

export class ClientQuotationController {

  // GET /api/quotations - fetch all quotations sent to this client
  static async getQuotations(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Missing token" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyClientToken(token);
      const leadId = Number(payload.id);

      const quotationLeads = await prisma.quotationLead.findMany({
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
      const lead = await prisma.leadsDetail.findUnique({
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
        let parsedItems: any[] = [];
        if (q.items) {
          try {
            parsedItems = Array.isArray(q.items) ? q.items : JSON.parse(q.items as string);
          } catch {
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
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // GET /api/quotations/addons - fetch all addon services
  static async getAddons(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Missing token" });
      }

      const addons = await prisma.addonService.findMany({
        where: { isActive: true },
      });
      return res.status(200).json({ success: true, data: addons });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // PATCH /api/quotations/:id/approve
  static async approveQuotation(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Missing token" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyClientToken(token);
      const leadId = Number(payload.id);
      const quotationLeadId = Number(req.params.id);

      // Verify this quotation belongs to this client
      const ql = await prisma.quotationLead.findFirst({
        where: { id: quotationLeadId, leadId },
      });

      if (!ql) {
        return res.status(404).json({ success: false, message: "Quotation not found" });
      }

      if (ql.status !== "pending" && ql.status !== "sent") {
        return res.status(400).json({ success: false, message: "Quotation cannot be approved in its current state" });
      }

      const { addons } = req.body;

      if (addons && Array.isArray(addons) && addons.length > 0) {
        const addonIds = addons.map((a: any) => a.addonServiceId);
        const addonServices = await prisma.addonService.findMany({
          where: { id: { in: addonIds } }
        });
        
        const addonServiceMap = new Map(addonServices.map(a => [a.id, a]));

        const fullAddonData = addons.map((a: any) => {
          const service = addonServiceMap.get(a.addonServiceId);
          const price = service ? Number(service.price) : 0;
          const qty = a.quantity || 1;
          return {
            leadId,
            addonServiceId: a.addonServiceId,
            quantity: qty,
            price: price,
            total: price * qty,
            category: a.category || "Unknown",
          };
        });

        await prisma.leadAddon.createMany({
          data: fullAddonData,
          skipDuplicates: true
        });
      }

      await prisma.quotationLead.update({
        where: { id: quotationLeadId },
        data: { status: "approved" },
      });

      // Advance lead to Confirmation stage
      await prisma.leadsDetail.update({
        where: { leadId },
        data: { currentStage: "Confirmation" },
      });

      return res.status(200).json({ success: true, message: "Quotation approved successfully" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // PATCH /api/quotations/:id/reject
  static async rejectQuotation(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Missing token" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyClientToken(token);
      const leadId = Number(payload.id);
      const quotationLeadId = Number(req.params.id);

      const ql = await prisma.quotationLead.findFirst({
        where: { id: quotationLeadId, leadId },
      });

      if (!ql) {
        return res.status(404).json({ success: false, message: "Quotation not found" });
      }

      await prisma.quotationLead.update({
        where: { id: quotationLeadId },
        data: { status: "rejected" },
      });

      return res.status(200).json({ success: true, message: "Quotation rejected" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // POST /api/quotations/:id/issue - raise a query/issue on a quotation
  static async raiseIssue(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Missing token" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyClientToken(token);
      const leadId = Number(payload.id);
      const quotationLeadId = Number(req.params.id);

      const { issueTitle, description } = req.body;
      if (!issueTitle) {
        return res.status(400).json({ success: false, message: "Issue title is required" });
      }

      const ql = await prisma.quotationLead.findFirst({
        where: { id: quotationLeadId, leadId },
      });

      if (!ql) {
        return res.status(404).json({ success: false, message: "Quotation not found" });
      }

      const issue = await prisma.quotationLeadIssues.create({
        data: {
          quotationLeadId,
          issueTitle,
          description: description || null,
          status: "Open",
        },
      });

      // 🔔 Notify admin + assigned employees (non-blocking)
      try {
        const lead = await prisma.leadsDetail.findUnique({ where: { leadId } });
        const leadName = lead?.firstName ? `${lead.firstName} ${lead.lastName || ''}`.trim() : null;
        const leadLabel = leadName ? `"${leadName}"` : `#${leadId}`;
        const title = `Client raised a quotation issue`;
        const descPart = description ? `\nDetails: ${description}` : "";
        const message = `The client for lead ${leadLabel} raised an issue.\n\nIssue: "${issueTitle}"${descPart}\n\nPlease review and respond.`;

        // All admins
        const admins = await prisma.user.findMany({
          where: { role: "admin" },
          select: { userId: true },
        });

        // Assigned employees for this lead
        const assignments = await prisma.leadEmployee.findMany({
          where: { leadId },
          include: { employee: { select: { userId: true } } },
        });
        
        const employeeUserIds = assignments
          .map((a) => a.employee.userId)
          .filter((uid) => uid !== null) as number[];

        const allAdminIds = admins.map((a) => a.userId);
        const uniqueUserIds = [...new Set([...allAdminIds, ...employeeUserIds])];

        if (uniqueUserIds.length > 0) {
          await prisma.notification.createMany({
            data: uniqueUserIds.map((userId) => ({
              userId,
              issueType: "QuotationIssue",
              title,
              message,
              isRead: false,
            })),
          });
        }
      } catch (notificationError) {
        console.error("Failed to create notification on client query:", notificationError);
      }

      return res.status(201).json({ success: true, data: issue, message: "Query raised successfully" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default ClientQuotationController;
