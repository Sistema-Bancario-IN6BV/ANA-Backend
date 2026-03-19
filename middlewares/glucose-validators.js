'use strict';

import { body, param } from 'express-validator';
import checkValidators from './checkValidators.js';
import { validateJWT } from './auth-jwt.js';
import { requireRole } from './validate-role.js';

export const validateCreate = [
    validateJWT,
    requireRole('ELDERLY_ROLE'),
    body('glucoseLevel')
        .notEmpty().withMessage('El nivel de glucosa es requerido')
        .isNumeric().withMessage('Debe ser un número')
        .custom(val => {
            if (val < 0 || val > 1000) throw new Error('Valor inválido (0-1000)');
            return true;
        }),
    body('measureType')
        .notEmpty().withMessage('El tipo de medición es requerido')
        .isIn(['AYUNAS', 'POSTPRANDIAL', 'ALEATORIO']).withMessage('Tipo de medición inválido'),
    body('measuredAt')
        .optional()
        .isISO8601().withMessage('Fecha inválida'),
    body('notes')
        .optional()
        .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),
    checkValidators,
];

export const validateStatusChange = [
    validateJWT,
    requireRole('ADMIN_ROLE'),
    param('id').isString().withMessage('ID inválido'),
    checkValidators,
];

export const validateGetById = [
    validateJWT,
    param('id').isString().withMessage('ID inválido'),
    checkValidators,
];