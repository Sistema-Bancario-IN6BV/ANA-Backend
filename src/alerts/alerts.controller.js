'use strict';

import Alert from './alerts.model.js';
import CaregiverLink from '../caregivers/caregivers.model.js';
import { User } from '../users/user.model.js';
import { sendAlertEmail } from '../../helpers/email-service.js';

export const createAlert = async (req, res) => {
    try {
        const { type, severity, message } = req.body;
        const elderly = req.user?.id; // Extraer del token JWT

        if (!elderly) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const alert = new Alert({
            elderly,
            type,
            severity,
            message,
            isRead: false
        });

        await alert.save();

        // Buscar cuidador primario del abuelo
        const primaryCaregiver = await CaregiverLink.findOne({
            elderly: elderly,
            isPrimary: true,
            isActive: true
        }).populate('caregiver', 'email name');

        // Enviar email al cuidador si existe
        if (primaryCaregiver && primaryCaregiver.caregiver?.email) {
            try {
                await sendAlertEmail(
                    primaryCaregiver.caregiver.email,
                    primaryCaregiver.caregiver.name,
                    type,
                    severity,
                    message
                );
                console.log(`Alerta enviada por email a ${primaryCaregiver.caregiver.email}`);
            } catch (emailError) {
                console.error('Error al enviar alerta por email:', emailError.message);
                // No lanzamos error para no fallar la creación de la alerta
            }
        }

        res.status(201).json({
            success: true,
            message: 'Alerta creada exitosamente',
            data: alert
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear alerta',
            error: error.message
        });
    }
};

export const getAlerts = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, severity, isRead } = req.query;
        const currentUser = req.user;

        let filter = { isActive: true };

        // Los abuelos ven solo sus propias alertas
        if (currentUser.role === 'ELDERLY_ROLE') {
            filter.elderly = currentUser.id;
        } 
        // Los cuidadores ven alertas de sus abuelos asignados
        else if (currentUser.role === 'CAREGIVER_ROLE') {
            const links = await CaregiverLink.find({
                caregiver: currentUser.id,
                isActive: true
            }).select('elderly');

            const elderlyIds = links.map(link => link.elderly);
            filter.elderly = { $in: elderlyIds };
        }
        // Los admins ven todas las alertas

        if (type) filter.type = type;
        if (severity) filter.severity = severity;
        if (isRead !== undefined) filter.isRead = isRead === 'true';

        const alerts = await Alert.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ severity: -1, createdAt: -1 });

        const total = await Alert.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: alerts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener alertas',
            error: error.message
        });
    }
};

export const getAlertById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        const alert = await Alert.findById(id)
            .populate('elderly', 'name email phone')
            .populate('readBy', 'name');

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alerta no encontrada'
            });
        }

        if (currentUser.role === 'ADMIN_ROLE') {
            return res.status(200).json({
                success: true,
                data: alert
            });
        }

        if (currentUser.role === 'CAREGIVER_ROLE') {
            const link = await CaregiverLink.findOne({
                caregiver: currentUser.id,
                elderly: alert.elderly._id,
                isActive: true
            });

            if (link) {
                return res.status(200).json({
                    success: true,
                    data: alert
                });
            }
        }

        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para ver esta alerta'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener alerta',
            error: error.message
        });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        const alert = await Alert.findById(id);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alerta no encontrada'
            });
        }

        if (currentUser.role === 'CAREGIVER_ROLE') {
            const link = await CaregiverLink.findOne({
                caregiver: currentUser.id,
                elderly: alert.elderly,
                isActive: true
            });

            if (!link) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para marcar esta alerta'
                });
            }
        }

        alert.isRead = true;
        alert.readBy = currentUser.id;
        alert.readAt = new Date();

        await alert.save();

        res.status(200).json({
            success: true,
            message: 'Alerta marcada como leída',
            data: alert
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al marcar alerta como leída',
            error: error.message
        });
    }
};

export const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const isActivate = req.url.includes('/activate');

        const alert = await Alert.findById(id);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alerta no encontrada'
            });
        }

        alert.isActive = isActivate;
        await alert.save();

        res.status(200).json({
            success: true,
            message: isActivate ? 'Alerta activada exitosamente' : 'Alerta desactivada exitosamente',
            data: {
                id: alert._id,
                isActive: alert.isActive
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al cambiar estado de alerta',
            error: error.message
        });
    }
};