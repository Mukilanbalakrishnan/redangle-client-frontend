import express from 'express';
import { getClientDeliveries, approveClientDelivery, raiseClientQuery } from '../controller/clientDeliveryController';

const router = express.Router();


router.get('/', getClientDeliveries);
router.patch('/:deliveryId/approve', approveClientDelivery);
router.post('/:deliveryId/query', raiseClientQuery);

export default router;
