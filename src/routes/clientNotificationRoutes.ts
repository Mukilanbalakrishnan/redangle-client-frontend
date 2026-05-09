import express from 'express';
import { getClientNotifications } from '../controller/clientNotificationController';
import { verifyClientToken } from '../util/auth';

const router = express.Router();

// Get dynamically generated client notifications
router.get('/', verifyClientToken, getClientNotifications);

export default router;
