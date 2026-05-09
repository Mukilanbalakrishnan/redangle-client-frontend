import { Request, Response } from "express";
import prisma from "../config/prisma";
import { verifyClientToken } from "../util/auth";

const normalizeStatus = (status?: string | null) => String(status || "").toLowerCase();

const toNumber = (value: any) => {
  if (value === null || value === undefined) return 0;
  const numeric = typeof value === "object" && typeof value.toNumber === "function" ? value.toNumber() : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getClientLeadId = (req: Request) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("Unauthorized");

  const payload = verifyClientToken(token);
  if (!payload.id) throw new Error("Unauthorized");

  return Number(payload.id);
};

const buildTracking = ({
  hasAssignment,
  hasEvent,
  rawDeliveries,
  finalDeliveries,
}: {
  hasAssignment: boolean;
  hasEvent: boolean;
  rawDeliveries: any[];
  finalDeliveries: any[];
}) => {
  const rawApproved = rawDeliveries.some((delivery) => normalizeStatus(delivery.status) === "client_approved");
  const finalApproved = finalDeliveries.some((delivery) => normalizeStatus(delivery.status) === "client_approved");

  return [
    {
      label: "Work assigned",
      status: hasAssignment ? "completed" : "pending",
      detail: hasAssignment ? "Team member has been assigned to this work." : "Assignment is not available yet.",
    },
    {
      label: "Schedule confirmed",
      status: hasEvent ? "completed" : hasAssignment ? "in_progress" : "pending",
      detail: hasEvent ? "Event or production schedule is linked." : "Schedule details will appear after confirmation.",
    },
    {
      label: "Incoming data received",
      status: rawDeliveries.length > 0 ? "completed" : hasEvent ? "in_progress" : "pending",
      detail: rawDeliveries.length > 0 ? "Raw files are available for client review." : "No incoming data has been delivered yet.",
    },
    {
      label: "Incoming data approved",
      status: rawApproved ? "completed" : rawDeliveries.length > 0 ? "in_progress" : "pending",
      detail: rawApproved ? "Incoming data has been approved." : "Awaiting client approval.",
    },
    {
      label: "Final delivery ready",
      status: finalDeliveries.length > 0 ? "completed" : rawApproved ? "in_progress" : "pending",
      detail: finalDeliveries.length > 0 ? "Final delivery is available." : "Final delivery is not ready yet.",
    },
    {
      label: "Final delivery approved",
      status: finalApproved ? "completed" : finalDeliveries.length > 0 ? "in_progress" : "pending",
      detail: finalApproved ? "Final files have been approved." : "Awaiting final approval.",
    },
  ];
};

const resolveWorkStatus = (leadStatus: string, rawDeliveries: any[], finalDeliveries: any[]) => {
  const finalApproved = finalDeliveries.some((delivery) => normalizeStatus(delivery.status) === "client_approved");
  if (finalApproved) return "completed";
  if (finalDeliveries.length > 0) return "final_review";
  const rawApproved = rawDeliveries.some((delivery) => normalizeStatus(delivery.status) === "client_approved");
  if (rawApproved) return "post_production";
  if (rawDeliveries.length > 0) return "client_review";
  return leadStatus || "in_progress";
};

const buildProjectMeta = (lead: any, rawDeliveries: any[], finalDeliveries: any[]) => {
  const budget = toNumber(lead.budget);
  const paidAmount = toNumber(lead.paidAmount);
  const discount = toNumber(lead.discount);

  return {
    clientName: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email || "Client",
    email: lead.email,
    phone: lead.contactNumber,
    address: lead.address,
    eventType: lead.eventType,
    eventDate: lead.eventDate,
    leadSource: lead.leadSource,
    leadStatus: lead.status,
    currentStage: lead.currentStage,
    budget,
    paidAmount,
    discount,
    balance: Math.max(0, budget - paidAmount - discount),
    deliveryStatus: {
      incomingTotal: rawDeliveries.length,
      incomingPending: rawDeliveries.filter((delivery) =>
        ["pending", "query_raised"].includes(normalizeStatus(delivery.status))
      ).length,
      incomingApproved: rawDeliveries.filter((delivery) => normalizeStatus(delivery.status) === "client_approved").length,
      finalTotal: finalDeliveries.length,
      finalPending: finalDeliveries.filter((delivery) =>
        ["pending", "query_raised"].includes(normalizeStatus(delivery.status))
      ).length,
      finalApproved: finalDeliveries.filter((delivery) => normalizeStatus(delivery.status) === "client_approved").length,
    },
  };
};

export const getClientWorks = async (req: Request, res: Response) => {
  try {
    const leadId = getClientLeadId(req);

    const lead = await prisma.leadsDetail.findUnique({
      where: { leadId },
      include: {
        leadEmployee: {
          include: {
            employee: {
                select: {
                firstName: true,
                lastName: true,
                contactNumber: true,
                position: true,
                workLocation: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        events: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                position: true,
              },
            },
          },
          orderBy: { eventDatetime: "asc" },
        },
        clientDeliveries: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: "Client lead not found" });
    }

    const rawDeliveries = lead.clientDeliveries.filter((delivery) =>
      ["RAW_DATA", "EVENT_RAW_DATA"].includes(delivery.deliveryType)
    );
    const finalDeliveries = lead.clientDeliveries.filter((delivery) => delivery.deliveryType === "FINAL_DELIVERABLES");
    const projectMeta = buildProjectMeta(lead, rawDeliveries, finalDeliveries);
    const projectStatus = resolveWorkStatus(lead.status, rawDeliveries, finalDeliveries);

    const clientName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email || "Client";
    const works = [
      ...lead.leadEmployee.map((assignment) => {
        const employeeName = `${assignment.employee?.firstName || ""} ${assignment.employee?.lastName || ""}`.trim();
        const matchingEvents = lead.events.filter((event) => event.employeeId === assignment.employeeId);

        return {
          id: `assignment-${assignment.leadEmployeeId}`,
          type: "assignment",
          title: assignment.taskName || assignment.employee?.position || "Assigned Work",
          status: resolveWorkStatus("assigned", rawDeliveries, finalDeliveries),
          priority: assignment.priority || "Normal",
          createdAt: assignment.createdAt,
          deadline: assignment.deadline,
          estimatedDuration: assignment.EstimatedDuration,
          description: assignment.description || "Work assigned by the production team.",
          assignedTo: {
            name: employeeName || "Assigned team member",
            role: assignment.employee?.position || "Team Member",
            email: null,
            phone: assignment.employee?.contactNumber || null,
            location: assignment.employee?.workLocation || null,
          },
          events: matchingEvents,
          tracking: buildTracking({
            hasAssignment: true,
            hasEvent: matchingEvents.length > 0 || lead.events.length > 0,
            rawDeliveries,
            finalDeliveries,
          }),
          incomingData: rawDeliveries,
          finalDelivery: finalDeliveries,
          project: projectMeta,
        };
      }),
      ...lead.events.map((event) => ({
        id: `event-${event.eventId}`,
        type: "event",
        title: event.eventName,
        status: resolveWorkStatus(String(event.status || ""), rawDeliveries, finalDeliveries),
        priority: "Event",
        createdAt: event.createdAt,
        deadline: event.eventDatetime,
        estimatedDuration: null,
        description: event.notes || "Scheduled production event.",
        assignedTo: {
          name: `${event.employee?.firstName || ""} ${event.employee?.lastName || ""}`.trim() || "Production team",
          role: event.employee?.position || "Event Team",
          email: null,
          phone: null,
          location: null,
        },
        events: [event],
        tracking: buildTracking({
          hasAssignment: Boolean(event.employeeId),
          hasEvent: true,
          rawDeliveries,
          finalDeliveries,
        }),
        incomingData: rawDeliveries,
        finalDelivery: finalDeliveries,
        project: projectMeta,
      })),
    ];

    if (works.length === 0) {
      works.push({
        id: `project-${lead.leadId}`,
        type: "project",
        title: `${lead.eventType || "Project"} Project`,
        status: projectStatus,
        priority: lead.priority || "Normal",
        createdAt: lead.createdTime,
        deadline: lead.eventDate,
        estimatedDuration: null,
        description: lead.description || "Current project work is being tracked by the Red Angle production team.",
        assignedTo: {
          name: lead.leadFollowedBy || "Red Angle team",
          role: "Project coordinator",
          email: null,
          phone: null,
          location: null,
        },
        events: lead.events,
        tracking: buildTracking({
          hasAssignment: true,
          hasEvent: lead.events.length > 0,
          rawDeliveries,
          finalDeliveries,
        }),
        incomingData: rawDeliveries,
        finalDelivery: finalDeliveries,
        project: projectMeta,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        client: {
          leadId: lead.leadId,
          leadSerialNumber: lead.leadSerialNumber,
          name: clientName,
          email: lead.email,
          phone: lead.contactNumber,
          address: lead.address,
          eventType: lead.eventType,
          eventDate: lead.eventDate,
          status: lead.status,
          currentStage: lead.currentStage,
          createdAt: lead.createdTime,
        },
        summary: {
          totalWorks: works.length,
          incomingPending: rawDeliveries.filter((delivery) => normalizeStatus(delivery.status) === "pending").length,
          finalPending: finalDeliveries.filter((delivery) =>
            ["pending", "query_raised"].includes(normalizeStatus(delivery.status))
          ).length,
        },
        works,
      },
    });
  } catch (error: any) {
    const status = error.message === "Unauthorized" ? 401 : 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to fetch client works" });
  }
};
