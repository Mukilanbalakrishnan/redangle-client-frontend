"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientEvents = void 0;
const client_1 = require("@prisma/client");
const auth_1 = require("../util/auth");
const prisma = new client_1.PrismaClient();
const getClientEvents = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const payload = (0, auth_1.verifyClientToken)(token);
        const leadId = payload.id;
        if (!leadId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const events = await prisma.events.findMany({
            where: { leadId: Number(leadId) },
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { eventDatetime: 'asc' }
        });
        res.status(200).json({ success: true, data: events });
    }
    catch (error) {
        console.error('GET CLIENT EVENTS ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getClientEvents = getClientEvents;
