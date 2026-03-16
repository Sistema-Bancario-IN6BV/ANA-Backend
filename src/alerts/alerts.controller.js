'use strict';

import { getPatientAlerts, getActiveAlerts, markAlertAsViewed, resolveAlert } from './alerts.service.js';
import { sendResponse } from '../utils/responseHandler.js';

/**
 * Obtener mis alertas (paciente)
 * GET /api/v1/alerts/my-alerts
 */
export const getMyAlerts = async (req, res, next) => {
    try {
        const patientId = req.user.id;
        const { limit = 50 } = req.query;

        const alerts = await getPatientAlerts(patientId, { limit: parseInt(limit) });

        sendResponse(res, 200, true, 'Alertas obtenidas', alerts);
    } catch (error) {
        next(error);
    }
};

/**
 * Ver alertas de un paciente (cuidador)
 * GET /api/v1/alerts/patient/:patientId
 */
export const viewPatientAlerts = async (req, res, next) => {
    try {
        const { patientId } = req.params;

        // TODO: Verificar que el usuario sea cuidador del paciente
        const alerts = await getPatientAlerts(patientId);

        sendResponse(res, 200, true, 'Alertas del paciente obtenidas', alerts);
    } catch (error) {
        next(error);
    }
};

/**
 * Obtener alertas activas (no resueltas)
 * GET /api/v1/alerts/active
 */
export const getMyActiveAlerts = async (req, res, next) => {
    try {
        const patientId = req.user.id;

        const alerts = await getActiveAlerts(patientId);

        sendResponse(res, 200, true, `${alerts.length} alertas activas`, alerts);
    } catch (error) {
        next(error);
    }
};

/**
 * Marcar alerta como vista
 * PUT /api/v1/alerts/:alertId/mark-viewed
 */
export const markAsViewed = async (req, res, next) => {
    try {
        const { alertId } = req.params;
        const patientId = req.user.id;

        const updatedAlert = await markAlertAsViewed(alertId, patientId);

        sendResponse(res, 200, true, 'Alerta marcada como vista', updatedAlert);
    } catch (error) {
        next(error);
    }
};

/**
 * Resolver alerta
 * PUT /api/v1/alerts/:alertId/resolve
 */
export const resolveAlertAction = async (req, res, next) => {
    try {
        const { alertId } = req.params;
        const patientId = req.user.id;

        const resolvedAlert = await resolveAlert(alertId, patientId);

        sendResponse(res, 200, true, 'Alerta resuelta', resolvedAlert);
    } catch (error) {
        next(error);
    }
};
