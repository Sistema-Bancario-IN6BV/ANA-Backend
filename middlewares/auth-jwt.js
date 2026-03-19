'use strict';

import jwt from 'jsonwebtoken';
import { config } from '../configs/config.js';

export const validateJWT = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No hay token, autorización denegada'
            });
        }

        const decoded = jwt.verify(token, config.jwt.secret);

        // Extraer información del JWT
        const userId = decoded.sub || decoded.id || decoded.userId;
        const role = decoded.role || 'ELDERLY_ROLE'; // Default role

        // Mantener compatibilidad con ambos formatos esperados
        req.userId = userId;
        req.user = {
            id: userId,
            role: role,
            email: decoded.email,
            UserRoles: [{ Role: { Name: role } }]
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token no válido',
            error: error.message
        });
    }
};