'use strict';

import { body, param } from 'express-validator';
import checkValidators from './checkValidators.js';
import { validateJWT } from './auth-jwt.js';
import { requireRole } from './validate-role.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const validateCreate = [
    validateJWT,
    requireRole('ELDERLY_ROLE'),
    body('name')
        .notEmpty().withMessage('El nombre del medicamento es requerido')
        .isLength({ max: 150 }).withMessage('Máximo 150 caracteres'),
    body('dose')
        .notEmpty().withMessage('La dosis es requerida')
        .isLength({ max: 50 }).withMessage('Máximo 50 caracteres'),
    body('times')
        .isArray({ min: 1 }).withMessage('Se requiere al menos un horario')
        .custom((times) => times.every((t) => TIME_PATTERN.test(t)))
        .withMessage('Los horarios deben tener formato HH:mm (ej. "08:00")'),
    body('notes')
        .optional()
        .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),
    checkValidators,
];

export const validateUpdate = [
    validateJWT,
    requireRole('ELDERLY_ROLE'),
    param('id').isString().withMessage('ID inválido'),
    body('name')
        .optional()
        .isLength({ max: 150 }).withMessage('Máximo 150 caracteres'),
    body('dose')
        .optional()
        .isLength({ max: 50 }).withMessage('Máximo 50 caracteres'),
    body('times')
        .optional()
        .isArray({ min: 1 }).withMessage('Se requiere al menos un horario')
        .custom((times) => times.every((t) => TIME_PATTERN.test(t)))
        .withMessage('Los horarios deben tener formato HH:mm (ej. "08:00")'),
    body('notes')
        .optional()
        .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),
    checkValidators,
];

export const validateStatusChange = [
    validateJWT,
    requireRole('ELDERLY_ROLE'),
    param('id').isString().withMessage('ID inválido'),
    checkValidators,
];

export const validateGetById = [
    validateJWT,
    param('id').isString().withMessage('ID inválido'),
    checkValidators,
];

export const validateTake = [
    validateJWT,
    requireRole('ELDERLY_ROLE'),
    param('id').isString().withMessage('ID inválido'),
    checkValidators,
];

export const validateGetLogs = [
    validateJWT,
    param('id').isString().withMessage('ID inválido'),
    checkValidators,
];
