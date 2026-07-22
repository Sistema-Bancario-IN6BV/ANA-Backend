'use strict';

import Alert from './alerts.model.js';
import CaregiverLink from '../caregivers/caregivers.model.js';
import PushToken from '../notifications/pushToken.model.js';
import { sendAlertEmail } from '../../helpers/email-service.js';
import { sendExpoPush } from '../../helpers/expo-push.js';

// Notifica al cuidador principal del abuelo por email y, si tiene un token de
// notificaciones registrado, también por push. Cada canal falla en silencio
// por separado para no bloquear la creación de la alerta en sí.
const notifyPrimaryCaregiver = async (elderlyId, type, severity, message) => {
    const primaryCaregiver = await CaregiverLink.findOne({
        elderly: elderlyId,
        isPrimary: true,
        isActive: true
    }).select('caregiver');

    if (!primaryCaregiver?.caregiver) {
        console.warn(`No hay cuidador primario para enviar alerta de ${type}`);
        return;
    }

    const { findUserById } = await import('../../helpers/user-db.js');
    const caregiver = await findUserById(primaryCaregiver.caregiver);
    if (!caregiver) return;

    if (caregiver.Email) {
        try {
            await sendAlertEmail(caregiver.Email, caregiver.Name, type, severity, message);
            console.log(`Alerta ${type} enviada por email a ${caregiver.Email}`);
        } catch (emailError) {
            console.error(`Error al enviar alerta ${type} por email:`, emailError.message);
        }
    }

    try {
        const pushToken = await PushToken.findOne({ userId: caregiver.Id });
        if (pushToken?.token) {
            await sendExpoPush(pushToken.token, 'Alerta de ANA', message);
            console.log(`Alerta ${type} enviada por push a ${caregiver.Id}`);
        }
    } catch (pushError) {
        console.error(`Error al enviar alerta ${type} por push:`, pushError.message);
    }
};

export const generateEmotionAlert = async (elderlyId, emotion, confidence, analysisData) => {
    try {
        let severity;
        let message;

        switch (emotion) {
            case 'sad':
            case 'fear':
                severity = 'ALTA';
                message = `Emoción negativa detectada: ${emotion}. Nivel de confianza: ${(confidence * 100).toFixed(1)}%`;
                break;
            case 'angry':
            case 'disgust':
                severity = 'MEDIA';
                message = `Emoción negativa detectada: ${emotion}. Nivel de confianza: ${(confidence * 100).toFixed(1)}%`;
                break;
            default:
                severity = 'BAJA';
                message = `Emoción detectada: ${emotion}. Nivel de confianza: ${(confidence * 100).toFixed(1)}%`;
        }

        const alert = new Alert({
            elderly: elderlyId,
            type: 'EMOCION_NEGATIVA',
            severity,
            message,
            isActive: true
        });

        await alert.save();
        await notifyPrimaryCaregiver(elderlyId, 'EMOCION_NEGATIVA', severity, message);

        return {
            alertId: alert._id,
            alertType: alert.type,
            severity: alert.severity
        };
    } catch (error) {
        console.error('Error generating emotion alert:', error);
        return null;
    }
};

export const generateVitalAlert = async (elderlyId, type, value, details) => {
    try {
        let severity;
        let message;

        switch (type) {
            case 'PRESION_ALTA':
                severity = value > 180 ? 'CRITICA' : value > 160 ? 'ALTA' : 'MEDIA';
                message = `Presión arterial alta: ${value} mmHg. ${details || ''}`;
                break;
            case 'PRESION_BAJA':
                severity = value < 60 ? 'ALTA' : value < 80 ? 'MEDIA' : 'BAJA';
                message = `Presión arterial baja: ${value} mmHg. ${details || ''}`;
                break;
            case 'GLUCOSA_ALTA':
                severity = value > 300 ? 'CRITICA' : value > 250 ? 'ALTA' : 'MEDIA';
                message = `Glucosa elevada: ${value} mg/dL. ${details || ''}`;
                break;
            case 'GLUCOSA_BAJA':
                severity = value < 50 ? 'CRITICA' : value < 70 ? 'ALTA' : 'MEDIA';
                message = `Glucosa baja: ${value} mg/dL. ${details || ''}`;
                break;
            default:
                severity = 'BAJA';
                message = `Alerta de ${type}: ${value}`;
        }

        const alert = new Alert({
            elderly: elderlyId,
            type,
            severity,
            message,
            isActive: true
        });

        await alert.save();
        await notifyPrimaryCaregiver(elderlyId, type, severity, message);

        return {
            alertId: alert._id,
            alertType: alert.type,
            severity: alert.severity
        };
    } catch (error) {
        console.error('Error generating vital alert:', error);
        return null;
    }
};

export const generateCrisisAlert = async (elderlyId, analysisData) => {
    try {
        const severity = 'CRITICA';
        const keywords = analysisData?.keywords?.join(', ') || 'No identificadas';
        const dimension_scores = analysisData?.risk_assessment?.dimensions || {};

        let message = `🚨 ALERTA CRÍTICA DE RIESGO PSICOLÓGICO 🚨\n`;
        message += `Texto: "${analysisData?.text || 'N/A'}"\n`;
        message += `Keywords detectadas: ${keywords}\n`;
        message += `Dimensión crítica: Riesgo de suicidalidad\n`;
        message += `Score de riesgo: ${analysisData?.risk_assessment?.overall_score || 'N/A'}\n`;
        message += `ACCIÓN REQUERIDA: Contacto inmediato con el usuario.`;

        const alert = new Alert({
            elderly: elderlyId,
            type: 'EMOCION_NEGATIVA',
            severity,
            message,
            isActive: true
        });

        await alert.save();
        await notifyPrimaryCaregiver(elderlyId, 'EMOCION_NEGATIVA', severity, message);

        return {
            alertId: alert._id,
            alertType: alert.type,
            severity: alert.severity
        };
    } catch (error) {
        console.error('Error generating crisis alert:', error);
        return null;
    }
};

export const generateFallRiskAlert = async (elderlyId, summary) => {
    try {
        const severity = 'ALTA';
        const message = `Riesgo de caída detectado por ANA: ${summary || 'objetos en el suelo que podrían representar un riesgo de tropiezo.'}`;

        const alert = new Alert({
            elderly: elderlyId,
            type: 'RIESGO_CAIDA',
            severity,
            message,
            isActive: true
        });

        await alert.save();
        await notifyPrimaryCaregiver(elderlyId, 'RIESGO_CAIDA', severity, message);

        return {
            alertId: alert._id,
            alertType: alert.type,
            severity: alert.severity
        };
    } catch (error) {
        console.error('Error generating fall risk alert:', error);
        return null;
    }
};

export const generateMissedDoseAlert = async (elderlyId, medicationName, dose, time) => {
    try {
        const severity = 'MEDIA';
        const message = `${medicationName} (${dose}) no fue marcado como tomado cerca de las ${time}.`;

        const alert = new Alert({
            elderly: elderlyId,
            type: 'MEDICAMENTO_OMITIDO',
            severity,
            message,
            isActive: true
        });

        await alert.save();
        await notifyPrimaryCaregiver(elderlyId, 'MEDICAMENTO_OMITIDO', severity, message);

        return {
            alertId: alert._id,
            alertType: alert.type,
            severity: alert.severity
        };
    } catch (error) {
        console.error('Error generating missed dose alert:', error);
        return null;
    }
};
