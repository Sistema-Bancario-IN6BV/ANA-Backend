'use strict';

import { Router } from 'express';
import { createAlert, getAlerts, getAlertById, markAsRead, changeStatus } from './alerts.controller.js';
import {
    validateCreate,
    validateMarkAsRead,
    validateStatusChange,
    validateGetById
} from '../../middlewares/alert-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post('/create', validateCreate, createAlert);
router.get('/get', validateJWT, getAlerts);
router.get('/:id', validateGetById, getAlertById);
router.put('/:id/read', validateMarkAsRead, markAsRead);
router.put('/:id/activate', validateStatusChange, changeStatus);
router.put('/:id/deactivate', validateStatusChange, changeStatus);

export default router;