'use strict';

import CaregiverLink from './caregivers.model.js';
import { findUserById } from '../../helpers/user-db.js';

export const createLink = async (req, res) => {
    try {
        const { caregiver, relationship, isPrimary, notes } = req.body;
        const elderly = req.user?.id; // Extraer del token JWT

        // No necesitamos validar el usuario porque ya está autenticado y tiene rol ELDERLY_ROLE

        const caregiverUser = await findUserById(caregiver);
        if (!caregiverUser) {
            return res.status(400).json({
                success: false,
                message: 'El usuario cuidador no existe'
            });
        }

        // Verificar que el cuidador tiene rol CAREGIVER_ROLE
        const userRoles = caregiverUser.UserRoles || [];
        const hasCaregiverRole = userRoles.some(ur => ur.Role?.Name === 'CAREGIVER_ROLE');
        if (!hasCaregiverRole) {
            return res.status(400).json({
                success: false,
                message: 'El usuario debe tener rol CAREGIVER_ROLE'
            });
        }

        const existingLink = await CaregiverLink.findOne({
            elderly,
            caregiver,
            isActive: true
        });

        if (existingLink) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un vínculo activo entre estos usuarios'
            });
        }

        if (isPrimary) {
            await CaregiverLink.updateMany(
                { elderly, isPrimary: true, isActive: true },
                { isPrimary: false }
            );
        }

        const link = new CaregiverLink({
            elderly,
            caregiver,
            relationship,
            isPrimary: isPrimary || false,
            notes
        });

        await link.save();

        res.status(201).json({
            success: true,
            message: 'Vínculo creado exitosamente',
            data: link
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear vínculo',
            error: error.message
        });
    }
};

export const getLinks = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const currentUser = req.user;

        const filter = { isActive: true };

        // Los abuelos ven solo sus propios vínculos
        if (currentUser.role === 'ELDERLY_ROLE') {
            filter.elderly = currentUser.id;
        } 
        // Los cuidadores ven solo a sus abuelos asignados
        else if (currentUser.role === 'CAREGIVER_ROLE') {
            filter.caregiver = currentUser.id;
        }
        // Los admins ven todos

        const links = await CaregiverLink.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await CaregiverLink.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: links,
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
            message: 'Error al obtener vínculos',
            error: error.message
        });
    }
};

export const getLinkById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        const link = await CaregiverLink.findById(id);

        if (!link) {
            return res.status(404).json({
                success: false,
                message: 'Vínculo no encontrado'
            });
        }

        // Validar permisos
        if (currentUser.role === 'ADMIN_ROLE') {
            // Admin puede ver cualquier vínculo
        } else if (currentUser.role === 'ELDERLY_ROLE') {
            // Abuelo solo ve sus propios vínculos
            if (link.elderly !== currentUser.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver este vínculo'
                });
            }
        } else if (currentUser.role === 'CAREGIVER_ROLE') {
            // Cuidador solo ve sus propios abuelos asignados
            if (link.caregiver !== currentUser.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver este vínculo'
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este vínculo'
            });
        }

        return res.status(200).json({
            success: true,
            data: link
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener vínculo',
            error: error.message
        });
    }
};

export const updateLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { relationship, isPrimary, notes } = req.body;
        const currentUser = req.user;

        const link = await CaregiverLink.findById(id);
        if (!link) {
            return res.status(404).json({
                success: false,
                message: 'Vínculo no encontrado'
            });
        }

        // Validar permisos: el abuelo solo puede actualizar sus propios vínculos
        if (currentUser.role === 'ELDERLY_ROLE' && link.elderly !== currentUser.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para actualizar este vínculo'
            });
        }

        if (isPrimary && !link.isPrimary) {
            await CaregiverLink.updateMany(
                { elderly: link.elderly, isPrimary: true, isActive: true, _id: { $ne: id } },
                { isPrimary: false }
            );
        }

        if (relationship) link.relationship = relationship;
        if (isPrimary !== undefined) link.isPrimary = isPrimary;
        if (notes !== undefined) link.notes = notes;

        await link.save();

        res.status(200).json({
            success: true,
            message: 'Vínculo actualizado exitosamente',
            data: link
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar vínculo',
            error: error.message
        });
    }
};

export const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const isActivate = req.url.includes('/activate');

        const link = await CaregiverLink.findById(id);
        if (!link) {
            return res.status(404).json({
                success: false,
                message: 'Vínculo no encontrado'
            });
        }

        link.isActive = isActivate;
        await link.save();

        if (!isActivate) {
            await User.findByIdAndUpdate(link.caregiver, {
                $pull: { linkedElderly: link.elderly }
            });
        }

        res.status(200).json({
            success: true,
            message: isActivate ? 'Vínculo activado exitosamente' : 'Vínculo desactivado exitosamente',
            data: {
                id: link._id,
                isActive: link.isActive
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al cambiar estado del vínculo',
            error: error.message
        });
    }
};