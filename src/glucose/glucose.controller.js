'use strict';

import Glucose from './glucose.model.js';
import CaregiverLink from '../caregivers/caregivers.model.js';
import { generateVitalAlert } from '../alerts/alerts.service.js';
import { User } from '../users/user.model.js';

export const createRecord = async (req, res) => {
    try {
        const { glucoseLevel, measureType, measuredAt, notes } = req.body;
        const elderly = req.user?.id; // Extraer del token JWT
        const recordedBy = elderly; // El abuelo registra sus propios datos

        // No necesitamos validar el usuario porque ya está autenticado y tiene rol ELDERLY_ROLE

        const record = new Glucose({
            elderly,
            glucoseLevel,
            measureType,
            measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
            recordedBy,
            notes
        });

        await record.save();

        if (glucoseLevel > 180) {
            await generateVitalAlert(elderly, 'GLUCOSA_ALTA', glucoseLevel, `Tipo: ${measureType}`);
        } else if (glucoseLevel < 70) {
            await generateVitalAlert(elderly, 'GLUCOSA_BAJA', glucoseLevel, `Tipo: ${measureType}`);
        }

        res.status(201).json({
            success: true,
            message: 'Registro de glucosa creado exitosamente',
            data: record
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear registro',
            error: error.message
        });
    }
};

export const getRecords = async (req, res) => {
    try {
        const { page = 1, limit = 10, elderly, startDate, endDate, measureType } = req.query;
        const currentUser = req.user;

        let filter = { isActive: true };

        if (currentUser.role === 'ELDERLY_ROLE') {
            filter.elderly = currentUser.id;
        } else if (currentUser.role === 'CAREGIVER_ROLE') {
            const links = await CaregiverLink.find({
                caregiver: currentUser.id,
                isActive: true
            }).select('elderly');

            const elderlyIds = links.map(link => link.elderly);

            if (elderly) {
                if (!elderlyIds.some(id => id === elderly)) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para ver registros de este usuario'
                    });
                }
                filter.elderly = elderly;
            } else {
                filter.elderly = { $in: elderlyIds };
            }
        } else if (elderly) {
            filter.elderly = elderly;
        }

        if (startDate || endDate) {
            filter.measuredAt = {};
            if (startDate) filter.measuredAt.$gte = new Date(startDate);
            if (endDate) filter.measuredAt.$lte = new Date(endDate);
        }

        if (measureType) {
            filter.measureType = measureType;
        }

        const records = await Glucose.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ measuredAt: -1 });

        const total = await Glucose.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: records,
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
            message: 'Error al obtener registros',
            error: error.message
        });
    }
};

export const getRecordById = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await Glucose.findById(id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener registro',
            error: error.message
        });
    }
};

export const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const isActivate = req.url.includes('/activate');

        const record = await Glucose.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        record.isActive = isActivate;
        await record.save();

        res.status(200).json({
            success: true,
            message: isActivate ? 'Registro activado exitosamente' : 'Registro desactivado exitosamente',
            data: {
                id: record._id,
                isActive: record.isActive
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al cambiar estado del registro',
            error: error.message
        });
    }
};