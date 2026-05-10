"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuthController = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const auth_1 = require("../util/auth");
class ClientAuthController {
    // Verify token
    static async verify(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ success: false, message: "Missing token" });
            }
            const token = authHeader.split(" ")[1];
            const payload = (0, auth_1.verifyClientToken)(token);
            return res.status(200).json({
                success: true,
                data: {
                    ...payload,
                    roles: ["client"],
                    redirectPath: "/client/dashboard"
                }
            });
        }
        catch (e) {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
    }
    // Get current client tracker state
    static async getMe(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ success: false, message: "Missing token" });
            }
            const token = authHeader.split(" ")[1];
            const payload = (0, auth_1.verifyClientToken)(token);
            const lead = await prisma_1.default.leadsDetail.findUnique({
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
        }
        catch (e) {
            return res.status(500).json({ success: false, message: e.message });
        }
    }
    // Set Password using Token
    static async setPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({ success: false, message: "Token and new password are required" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
            }
            const lead = await prisma_1.default.leadsDetail.findFirst({
                where: { clientToken: token, isDeleted: false }
            });
            if (!lead) {
                return res.status(400).json({ success: false, message: "Invalid or expired setup token" });
            }
            const hashedPassword = await (0, auth_1.hashPassword)(newPassword);
            // Create new token to auto-login the user
            const clientName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email || "Client";
            const jwtToken = (0, auth_1.generateClientToken)({ id: String(lead.leadId), email: lead.email || "", name: clientName });
            await prisma_1.default.leadsDetail.update({
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
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message || "Failed to set password",
            });
        }
    }
    // Client Login
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email and password are required" });
            }
            const lead = await prisma_1.default.leadsDetail.findFirst({
                where: { email: email, isDeleted: false }
            });
            if (!lead || !lead.passwordHash) {
                return res.status(400).json({ success: false, message: "Invalid credentials" });
            }
            const valid = await (0, auth_1.comparePassword)(password, lead.passwordHash);
            if (!valid) {
                return res.status(400).json({ success: false, message: "Invalid credentials" });
            }
            const clientName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.email || "Client";
            const jwtToken = (0, auth_1.generateClientToken)({ id: String(lead.leadId), email: lead.email || "", name: clientName });
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
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
}
exports.ClientAuthController = ClientAuthController;
exports.default = ClientAuthController;
