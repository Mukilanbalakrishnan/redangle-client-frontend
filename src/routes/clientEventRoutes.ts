import express from 'express';
import { getClientEvents } from '../controller/clientEventController';

const router = express.Router();

router.get('/', getClientEvents);

export default router;
