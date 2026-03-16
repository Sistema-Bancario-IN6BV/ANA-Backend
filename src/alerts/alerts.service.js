'use strict';

import Alert from './alerts.model.js';
import CaregiverLink from '../caregivers/caregivers.model.js';
import { sendAlertEmail } from '../../helpers/email-service.js';

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

        // Buscar cuidador primario y enviar email
        try {
            const primaryCaregiver = await CaregiverLink.findOne({
                elderly: elderlyId,
                isPrimary: true,
                isActive: true
            }).select('caregiver');

            if (primaryCaregiver?.caregiver) {
                // Importar findUserById que maneja Sequelize correctamente
                const { findUserById } = await import('../../helpers/user-db.js');
                const caregiver = await findUserById(primaryCaregiver.caregiver);
                
                if (caregiver?.Email) {
                    await sendAlertEmail(
                        caregiver.Email,
                        caregiver.Name,
                        'EMOCION_NEGATIVA',
                        severity,
                        message
                    );
                    console.log(` Alerta emocional enviada por email a ${caregiver.Email}`);
                }
            }
        } catch (emailError) {
            console.error(' Error al enviar alerta emocional por email:', emailError.message);
        }

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

        // Buscar cuidador primario y enviar email
        try {
            const primaryCaregiver = await CaregiverLink.findOne({
                elderly: elderlyId,
                isPrimary: true,
                isActive: true
            }).select('caregiver');

            if (primaryCaregiver?.caregiver) {
                // Importar findUserById que maneja Sequelize correctamente
                const { findUserById } = await import('../../helpers/user-db.js');
                const caregiver = await findUserById(primaryCaregiver.caregiver);
                
                if (caregiver?.Email) {
                    const { sendAlertEmail } = await import('../../helpers/email-service.js');
                    await sendAlertEmail(
                        caregiver.Email,
                        caregiver.Name,
                        type,
                        severity,
                        message
                    );
                    console.log(` Alerta vital enviada por email a ${caregiver.Email}`);
                }
            } else {
                console.warn(` No hay cuidador primario para enviar alerta de ${type}`);
            }
        } catch (emailError) {
            console.error(' Error al enviar alerta vital por email:', emailError.message);
            // No lanzamos error para no fallar la creación de la alerta
        }

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