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

router.post('/create', validateJWT, validateCreate, createAlert);
router.get('/get', validateJWT, getAlerts);
router.get('/:id', validateJWT, validateGetById, getAlertById);
router.put('/:id/read', validateJWT, validateMarkAsRead, markAsRead);
router.put('/:id/activate', validateJWT, validateStatusChange, changeStatus);
router.put('/:id/deactivate', validateJWT, validateStatusChange, changeStatus);

export default router;