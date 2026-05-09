import { Request, Response } from "express";
import prisma from "../config/prisma";
import { hashPassword, comparePassword, generateClientToken, verifyClientToken } from "../util/auth";

export class ClientAuthController {
  // Verify token
  static async verify(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Missing token" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyClientToken(token);

      return res.status(200).json({
        success: true,
        data: {
          ...payload,
          roles: ["client"],
          redirectPath: "/client/dashboard"
        }
      });
    } catch (e: any) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  }

  // Get current client tracker state
  static async getMe(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Missing token" });
      }

      const token = authHeader.split(" ")[1];
      const payload = verifyClientToken(token);

      const lead = await prisma.leadsDetail.findUnique({
        where: { leadId: Number(payload.id) },
        select: {
          leadId: true,
          firstName: true,
          lastName: true,
          email: true,
          eventType: true,
          eventDate: true,
          currentStage: true,
          leadFollowedBy: true,
          events: true,
          leadEmployee: {
            include: { employee: true }
          }
        }
      });

      if (!lead) {
        return res.status(404).json({ success: false, message: "Lead not found" });
      }

      return res.status(200).json({
        success: true,
        data: lead
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // Set Password using Token
  static async setPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      }

      const lead = await prisma.leadsDetail.findFirst({
        where: { clientToken: token, isDeleted: false }
      });

      if (!lead) {
        return res.status(400).json({ success: false, message: "Invalid or expired setup token" });
      }

      const hashedPassword = await hashPassword(newPassword);

      // Create new token to auto-login the user
      const clientName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email || "Client";
      const jwtToken = generateClientToken({ id: String(lead.leadId), email: lead.email || "", name: clientName });

      await prisma.leadsDetail.update({
        where: { leadId: lead.leadId },
        data: {
          passwordHash: hashedPassword,
          clientToken: null // Invalidating setup token
        }
      });

      return res.status(200).json({
        success: true,
        message: "Password set successfully!",
        data: {
          token: jwtToken,
          role: "client",
          userId: lead.leadId,
          fullName: clientName,
          redirectPath: "/client/dashboard"
        }
      });

    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to set password",
      });
    }
  }

  // Client Login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
      }

      const lead = await prisma.leadsDetail.findFirst({
        where: { email: email, isDeleted: false }
      });

      if (!lead || !lead.passwordHash) {
        return res.status(400).json({ success: false, message: "Invalid credentials" });
      }

      const valid = await comparePassword(password, lead.passwordHash);
      if (!valid) {
        return res.status(400).json({ success: false, message: "Invalid credentials" });
      }

      const clientName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email || "Client";
      const jwtToken = generateClientToken({ id: String(lead.leadId), email: lead.email || "", name: clientName });

      return res.status(200).json({
        success: true,
        message: "Client login successful",
        data: {
          token: jwtToken,
          role: "client",
          userId: lead.leadId,
          fullName: clientName,
          redirectPath: "/client/dashboard"
        }
      });

    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

export default ClientAuthController;
