'use strict';

import Medication from './medications.model.js';
import MedicationLog from './medicationLog.model.js';
import CaregiverLink from '../caregivers/caregivers.model.js';

export const createRecord = async (req, res) => {
    try {
        const { name, dose, times, notes } = req.body;
        const elderly = req.user?.id; // Extraer del token JWT

        const record = new Medication({
            elderly,
            name,
            dose,
            times,
            notes
        });

        await record.save();

        res.status(201).json({
            success: true,
            message: 'Medicamento registrado exitosamente',
            data: record
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear medicamento',
            error: error.message
        });
    }
};

export const getRecords = async (req, res) => {
    try {
        const { page = 1, limit = 20, elderly } = req.query;
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
                        message: 'No tienes permiso para ver medicamentos de este usuario'
                    });
                }
                filter.elderly = elderly;
            } else {
                filter.elderly = { $in: elderlyIds };
            }
        } else if (elderly) {
            filter.elderly = elderly;
        }

        const records = await Medication.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Medication.countDocuments(filter);

        const withLastTaken = await Promise.all(
            records.map(async (record) => {
                const lastLog = await MedicationLog.findOne({ medication: record._id }).sort({ createdAt: -1 });
                return { ...record.toObject(), lastTakenAt: lastLog?.createdAt || null };
            })
        );

        res.status(200).json({
            success: true,
            data: withLastTaken,
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
            message: 'Error al obtener medicamentos',
            error: error.message
        });
    }
};

export const getRecordById = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await Medication.findById(id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Medicamento no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener medicamento',
            error: error.message
        });
    }
};

export const updateRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, dose, times, notes } = req.body;
        const currentUser = req.user;

        const record = await Medication.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Medicamento no encontrado'
            });
        }

        if (record.elderly !== currentUser.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para actualizar este medicamento'
            });
        }

        if (name !== undefined) record.name = name;
        if (dose !== undefined) record.dose = dose;
        if (times !== undefined) record.times = times;
        if (notes !== undefined) record.notes = notes;

        await record.save();

        res.status(200).json({
            success: true,
            message: 'Medicamento actualizado exitosamente',
            data: record
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar medicamento',
            error: error.message
        });
    }
};

export const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const isActivate = req.url.includes('/activate');

        const record = await Medication.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Medicamento no encontrado'
            });
        }

        if (record.elderly !== currentUser.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cambiar el estado de este medicamento'
            });
        }

        record.isActive = isActivate;
        await record.save();

        res.status(200).json({
            success: true,
            message: isActivate ? 'Medicamento activado exitosamente' : 'Medicamento desactivado exitosamente',
            data: {
                id: record._id,
                isActive: record.isActive
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al cambiar estado del medicamento',
            error: error.message
        });
    }
};

export const markAsTaken = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        const record = await Medication.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Medicamento no encontrado'
            });
        }

        if (record.elderly !== currentUser.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para registrar la toma de este medicamento'
            });
        }

        const log = await MedicationLog.create({ elderly: currentUser.id, medication: id });

        res.status(201).json({
            success: true,
            message: 'Toma registrada exitosamente',
            data: log
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al registrar la toma',
            error: error.message
        });
    }
};

export const getLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, skip = 0 } = req.query;
        const currentUser = req.user;

        const record = await Medication.findById(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Medicamento no encontrado'
            });
        }

        if (currentUser.role === 'ELDERLY_ROLE' && record.elderly !== currentUser.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este historial'
            });
        }

        if (currentUser.role === 'CAREGIVER_ROLE') {
            const link = await CaregiverLink.findOne({
                caregiver: currentUser.id,
                elderly: record.elderly,
                isActive: true
            });
            if (!link) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver este historial'
                });
            }
        }

        const logs = await MedicationLog.find({ medication: id })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.status(200).json({
            success: true,
            data: logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de tomas',
            error: error.message
        });
    }
};
