import express from 'express';
import { getClientNotifications } from '../controller/clientNotificationController';
import { authenticateClient } from '../util/auth';

const router = express.Router();

// Get dynamically generated client notifications
router.get('/', authenticateClient, getClientNotifications);

export default router;

