import { Request, Response } from "express";
import prisma from "../config/prisma";
import { verifyClientToken } from "../util/auth";

// Identical to buildInvoiceViewModel in the main backend
function buildInvoiceViewModel(invoice: any) {
  const itemsByCategory: Record<string, any[]> = {};

  // PACKAGES + their sub-items
  invoice.packageInvoices.forEach((pi: any) => {
    if (!itemsByCategory["PACKAGES"]) itemsByCategory["PACKAGES"] = [];
    itemsByCategory["PACKAGES"].push({
      name: pi.package.packageTitle,
      quantity: pi.unit,
      price: Number(pi.package.price || 0),
    });

    (pi.package.items || []).forEach((item: any) => {
      const category = (item.category || "SERVICE").toUpperCase();
      if (!itemsByCategory[category]) itemsByCategory[category] = [];
      const exists = itemsByCategory[category].some((i) => i.name === item.name);
      if (!exists) {
        itemsByCategory[category].push({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price || 0),
        });
      }
    });
  });

  // ADDONS
  if (invoice.addons?.length) {
    itemsByCategory["ADD-ONS"] = invoice.addons.map((addon: any) => {
      const baseName = addon.addonService?.name || "";
      const category = addon.category ? addon.category.toUpperCase() : "";
      const displayName = category ? `${baseName} (${category})` : baseName;
      return {
        name: displayName,
        quantity: addon.quantity,
        price: Number(addon.price || 0),
      };
    });
  }

  // INVOICE ITEMS (deliverables, extra items, etc.)
  invoice.invoiceItems?.forEach((item: any) => {
    let originalCategory = (item.category || "SERVICE").toUpperCase();
    let category = originalCategory;
    let name = item.name;

    if (!["DELIVERABLE", "DELIVERABLES", "COMPLIMENTARY", "EXTRA_COMPLEMENTARY"].includes(originalCategory)) {
      category = "ADD-ONS";
      if (originalCategory !== "SERVICE" && originalCategory !== "ADD-ONS") {
        name = `${item.name} (${originalCategory})`;
      }
    }

    if (!itemsByCategory[category]) itemsByCategory[category] = [];
    const exists = itemsByCategory[category].some(
      (i: any) => i.name === name || i.name === item.name
    );
    if (!exists) {
      itemsByCategory[category].push({
        name,
        quantity: item.quantity,
        price: Number(item.price || 0),
      });
    }
  });

  return itemsByCategory;
}

export class ClientInvoiceController {

  // GET /api/invoices  – all invoices for the authenticated client
  static async getInvoices(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer "))
        return res.status(401).json({ success: false, message: "Missing token" });

      const token = authHeader.split(" ")[1];
      const payload = verifyClientToken(token);
      const leadId = Number(payload.id);

      const invoices = await prisma.invoices.findMany({
        where: { leadId },
        include: {
          lead: true,
          packageInvoices: {
            where: { isRemoved: false },
            include: { package: { include: { items: true } } },
          },
          invoiceItems: true,
          addons: { include: { addonService: true } },
          payments: { orderBy: { paymentDate: "desc" } },
          invoiceAdditionals: true,
          issues: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });

      const result = invoices.map((inv) => {
        const itemsByCategory = buildInvoiceViewModel(inv);

        const packageTotal = inv.packageInvoices.reduce(
          (acc: number, pi: any) => acc + Number(pi.unit) * Number(pi.package.price),
          0
        );
        const addonTotal = inv.addons.reduce(
          (acc: number, a: any) => acc + Number(a.total || 0),
          0
        );
        const itemsTotal = inv.invoiceItems.reduce(
          (acc: number, item: any) =>
            acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
          0
        );

        const totalPrice = packageTotal + addonTotal + itemsTotal;
        const discount = Number(inv.discount ?? 0);
        const paid = Number(inv.paid ?? 0);
        const overall = totalPrice - discount;
        const balance = overall - paid;

        let previewEvents: any[] = [];
        if (inv.previewEvents) {
          try {
            previewEvents = Array.isArray(inv.previewEvents)
              ? inv.previewEvents
              : JSON.parse(inv.previewEvents as string);
          } catch { previewEvents = []; }
        }

        return {
          invoiceId: inv.invoiceId,
          status: inv.status,
          plan: inv.plan,
          billingDate: inv.billingDate,
          sentAt: inv.sendAt,
          token: inv.token,
          totalAmount: totalPrice,
          totalPrice,
          discount,
          paid,
          balance,
          previewEvents,
          itemsByCategory,
          packageInvoices: inv.packageInvoices.map((pi: any) => ({
            unit: pi.unit,
            package: { packageTitle: pi.package.packageTitle },
          })),
          lead: {
            leadId: inv.lead.leadId,
            firstName: inv.lead.firstName ?? "",
            lastName: inv.lead.lastName ?? "",
            email: inv.lead.email ?? null,
            contactNumber: inv.lead.contactNumber ?? null,
            address: inv.lead.address ?? null,
            eventType: inv.lead.eventType ?? null,
            eventDate: inv.lead.eventDate ?? null,
            description: inv.lead.description ?? null,
            leadSerialNumber: inv.lead.leadSerialNumber ?? null,
            leadType: inv.lead.leadType ?? "LD",
          },
          latestIssue: inv.issues[0]
            ? { issueId: inv.issues[0].issueId, issueTitle: inv.issues[0].issueTitle, status: inv.issues[0].status }
            : null,
        };
      });

      return res.status(200).json({ success: true, data: result });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // POST /api/invoices/:id/issue  – raise a billing issue
  static async raiseIssue(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer "))
        return res.status(401).json({ success: false, message: "Missing token" });

      const token = authHeader.split(" ")[1];
      const payload = verifyClientToken(token);
      const leadId = Number(payload.id);
      const invoiceId = Number(req.params.id);

      const { issueTitle, description } = req.body;
      if (!issueTitle)
        return res.status(400).json({ success: false, message: "Issue title is required" });

      const invoice = await prisma.invoices.findFirst({ where: { invoiceId, leadId } });
      if (!invoice)
        return res.status(404).json({ success: false, message: "Invoice not found" });

      const issue = await prisma.invoiceIssues.create({
        data: { invoiceId, issueTitle, description: description || null, status: "Open" },
      });

      return res.status(201).json({ success: true, data: issue, message: "Query raised successfully" });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
}

export default ClientInvoiceController;
