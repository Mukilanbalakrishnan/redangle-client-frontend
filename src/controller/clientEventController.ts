import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyClientToken } from '../util/auth';

const prisma = new PrismaClient();

export const getClientEvents = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        const payload = verifyClientToken(token);
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
    } catch (error: any) {
        console.error('GET CLIENT EVENTS ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
