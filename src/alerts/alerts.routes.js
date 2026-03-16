'use strict';

import { Router } from 'express';
import { getMyAlerts, viewPatientAlerts, getMyActiveAlerts, markAsViewed, resolveAlertAction } from './alerts.controller.js';
import { validateJWT, checkRole } from '../../middlewares/auth-jwt.js';
import { validateAlertId, validatePatientId, handleValidationErrors } from '../../middlewares/alerts-validators.js';

const router = Router();

/**
 * GET /api/v1/alerts/my-alerts
 * Ver mis alertas
 */
router.get(
    '/my-alerts',
    validateJWT,
    getMyAlerts
);

/**
 * GET /api/v1/alerts/active
 * Ver alertas activas sin resolver
 */
router.get(
    '/active',
    validateJWT,
    getMyActiveAlerts
);

/**
 * GET /api/v1/alerts/patient/:patientId
 * Ver alertas de un paciente (cuidador)
 */
router.get(
    '/patient/:patientId',
    validateJWT,
    checkRole(['caregiver', 'admin']),
    validatePatientId,
    handleValidationErrors,
    viewPatientAlerts
);

/**
 * PUT /api/v1/alerts/:alertId/mark-viewed
 * Marcar alerta como vista
 */
router.put(
    '/:alertId/mark-viewed',
    validateJWT,
    validateAlertId,
    handleValidationErrors,
    markAsViewed
);

/**
 * PUT /api/v1/alerts/:alertId/resolve
 * Resolver alerta
 */
router.put(
    '/:alertId/resolve',
    validateJWT,
    validateAlertId,
    handleValidationErrors,
    resolveAlertAction
);

export default router;
