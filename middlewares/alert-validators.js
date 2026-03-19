'use strict';

import { body, param } from 'express-validator';
import checkValidators from './checkValidators.js';
import { validateJWT } from './auth-jwt.js';
import { requireRole } from './validate-role.js';

export const validateCreate = [
    validateJWT,
    body('type')
        .notEmpty().withMessage('El tipo de alerta es requerido')
        .isIn(['EMOCION_NEGATIVA', 'PRESION_ALTA', 'PRESION_BAJA', 'GLUCOSA_ALTA', 'GLUCOSA_BAJA', 'INACTIVIDAD'])
        .withMessage('Tipo de alerta inválido'),
    body('severity')
        .notEmpty().withMessage('La severidad es requerida')
        .isIn(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).withMessage('Severidad inválida'),
    body('message')
        .notEmpty().withMessage('El mensaje es requerido')
        .isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),
    checkValidators,
];

export const validateMarkAsRead = [
    validateJWT,
    param('id').isString().withMessage('ID inválido'),
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