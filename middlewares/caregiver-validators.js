'use strict';

import { body, param } from 'express-validator';
import checkValidators from './checkValidators.js';
import { validateJWT } from './auth-jwt.js';
import { requireRole } from './validate-role.js';

export const validateCreate = [
    validateJWT,
    requireRole('ELDERLY_ROLE'),
    body('caregiver')
        .notEmpty().withMessage('El cuidador es requerido')
        .isString().withMessage('ID del cuidador debe ser string'),
    body('relationship')
        .notEmpty().withMessage('La relación es requerida')
        .isIn(['HIJO', 'NIETO', 'FAMILIAR', 'PROFESIONAL']).withMessage('Relación inválida'),
    body('isPrimary')
        .optional()
        .isBoolean().withMessage('Debe ser booleano'),
    body('notes')
        .optional()
        .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),
    checkValidators,
];

export const validateUpdate = [
    validateJWT,
    requireRole('ELDERLY_ROLE'),
    param('id').isString().withMessage('ID inválido'),
    body('relationship')
        .optional()
        .isIn(['HIJO', 'NIETO', 'FAMILIAR', 'PROFESIONAL']).withMessage('Relación inválida'),
    body('isPrimary')
        .optional()
        .isBoolean().withMessage('Debe ser booleano'),
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