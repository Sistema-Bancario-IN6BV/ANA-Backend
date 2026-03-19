'use strict';

import { body, param } from 'express-validator';
import checkValidators from './checkValidators.js';
import { validateJWT } from './auth-jwt.js';
import { requireRole } from './validate-role.js';

export const validateCreate = [
    validateJWT,
    requireRole('ELDERLY_ROLE'),
    body('systolic')
        .notEmpty().withMessage('La presión sistólica es requerida')
        .isNumeric().withMessage('Debe ser un número')
        .custom(val => {
            if (val < 0 || val > 300) throw new Error('Valor inválido (0-300)');
            return true;
        }),
    body('diastolic')
        .notEmpty().withMessage('La presión diastólica es requerida')
        .isNumeric().withMessage('Debe ser un número')
        .custom(val => {
            if (val < 0 || val > 200) throw new Error('Valor inválido (0-200)');
            return true;
        }),
    body('pulse')
        .optional()
        .isNumeric().withMessage('Debe ser un número')
        .custom(val => {
            if (val && (val < 0 || val > 300)) throw new Error('Valor inválido (0-300)');
            return true;
        }),
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