'use strict';

import BloodPressure from './bloodPressure.model.js';
import CaregiverLink from '../caregivers/caregivers.model.js';
import { generateVitalAlert } from '../alerts/alerts.service.js';
import { User } from '../users/user.model.js';

export const createRecord = async (req, res) => {
    try {
        const { systolic, diastolic, pulse, measuredAt, notes } = req.body;
        const elderly = req.user?.id; // Extraer del token JWT
        const recordedBy = elderly; // El abuelo registra sus propios datos

        // No necesitamos validar el usuario porque ya está autenticado y tiene rol ELDERLY_ROLE

        const record = new BloodPressure({
            elderly,
            systolic,
            diastolic,
            pulse,
            measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
            recordedBy,
            notes
        });

        await record.save();

        if (systolic > 140 || diastolic > 90) {
            await generateVitalAlert(elderly, 'PRESION_ALTA', systolic, `Diastólica: ${diastolic} mmHg`);
        } else if (systolic < 90 || diastolic < 60) {
            await generateVitalAlert(elderly, 'PRESION_BAJA', systolic, `Diastólica: ${diastolic} mmHg`);
        }

        res.status(201).json({
            success: true,
            message: 'Registro de presión arterial creado exitosamente',
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
        const { page = 1, limit = 10, elderly, startDate, endDate } = req.query;
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

        const records = await BloodPressure.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ measuredAt: -1 });

        const total = await BloodPressure.countDocuments(filter);

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

        const record = await BloodPressure.findById(id);

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

        const record = await BloodPressure.findById(id);
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