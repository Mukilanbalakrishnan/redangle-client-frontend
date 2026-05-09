import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { verifyClientToken } from '../util/auth';

const prisma = new PrismaClient(); // Reload Prisma Client

const appendDeliveryNote = (currentNotes: string | null | undefined, label: string, message?: string) => {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) return currentNotes || '';
    const entry = `${label} (${new Date().toLocaleDateString()}): ${cleanMessage}`;
    return `${currentNotes || ''}${currentNotes ? '\n\n' : ''}${entry}`;
};

export const getClientDeliveries = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        const payload = verifyClientToken(token);
        const leadId = payload.id;

        if (!leadId) {
            console.log("Unauthorized: no leadId");
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        console.log("Fetching deliveries for leadId:", leadId);
        const deliveries = await prisma.clientDelivery.findMany({
            where: { leadId: Number(leadId) },
            orderBy: { createdAt: 'desc' }
        });
        console.log("Found deliveries:", deliveries.length);

        res.status(200).json({ success: true, data: deliveries });
    } catch (error: any) {
        console.error('GET CLIENT DELIVERIES ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const approveClientDelivery = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        const payload = verifyClientToken(token);
        const leadId = payload.id;
        const { deliveryId } = req.params;
        const comment = String(req.body?.comment || '').trim();

        if (!leadId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const delivery = await prisma.clientDelivery.findFirst({
            where: { id: Number(deliveryId), leadId: Number(leadId) }
        });

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        // Ask the CRM workflow to release the next stage before committing the local approval.
        try {
            const lead = await prisma.leadsDetail.findUnique({ where: { leadId: Number(leadId) } });
            const serialNumber = lead?.leadSerialNumber || leadId;
            const CRM_API_URL = process.env.CRM_API_URL || 'http://localhost:5001/api';
            await axios.patch(`${CRM_API_URL}/crm/client-deliveries/${serialNumber}/client-approve`, {
                deliveryId: delivery.id,
                deliveryType: delivery.deliveryType,
                leadId: serialNumber,
                comment: comment || undefined,
            });
        } catch (e: any) {
            console.error('Failed to notify CRM backend of approval:', e.message);
            return res.status(502).json({ success: false, message: 'CRM workflow did not accept the approval. Please try again.' });
        }

        const updated = await prisma.clientDelivery.update({
            where: { id: Number(deliveryId) },
            data: {
                status: 'client_approved',
                notes: appendDeliveryNote(delivery.notes, 'Client Approval', comment),
            }
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        console.error('APPROVE CLIENT DELIVERY ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const raiseClientQuery = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        const payload = verifyClientToken(token);
        const leadId = payload.id;
        const { deliveryId } = req.params;
        const { queryMessage } = req.body;
        const cleanQueryMessage = String(queryMessage || '').trim();

        if (!leadId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const delivery = await prisma.clientDelivery.findFirst({
            where: { id: Number(deliveryId), leadId: Number(leadId) }
        });

        if (!delivery) {
            return res.status(404).json({ success: false, message: 'Delivery not found' });
        }

        if (!cleanQueryMessage) {
            return res.status(400).json({ success: false, message: 'Query message is required.' });
        }

        if (delivery.queryCount >= 2) {
            return res.status(400).json({ success: false, message: 'Query limit exceeded. You can only raise a query 2 times.' });
        }

        const newNotes = appendDeliveryNote(delivery.notes, 'Client Query', cleanQueryMessage);

        const updated = await prisma.clientDelivery.update({
            where: { id: Number(deliveryId) },
            data: { 
                status: 'query_raised',
                notes: newNotes,
                queryCount: { increment: 1 }
            }
        });

        let crmNotificationSent = false;

        // Notify CRM backend about the query
        try {
            const lead = await prisma.leadsDetail.findUnique({ where: { leadId: Number(leadId) } });
            const serialNumber = lead?.leadSerialNumber || leadId;
            const CRM_API_URL = process.env.CRM_API_URL || 'http://localhost:5001/api';
            await axios.post(`${CRM_API_URL}/data-manager/${serialNumber}/client-query`, {
                queryMessage: cleanQueryMessage,
                deliveryId: delivery.id,
                deliveryType: delivery.deliveryType,
                leadId: serialNumber,
            });
            crmNotificationSent = true;
        } catch (e: any) {
            console.error('Failed to notify CRM backend of query:', e.response?.data || e.message);
        }

        res.status(200).json({ success: true, data: updated, crmNotificationSent });
    } catch (error: any) {
        console.error('RAISE CLIENT QUERY ERROR:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
