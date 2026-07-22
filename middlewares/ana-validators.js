'use strict';

import { body, param, query, validationResult } from 'express-validator';

/**
 * Validar entrada de texto para análisis
 */
export const validateTextInput = [
  body('text')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('El texto es requerido')
    .isLength({ min: 3, max: 5000 })
    .withMessage('El texto debe tener entre 3 y 5000 caracteres'),
];

/**
 * Validar parámetros de paginación
 */
export const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit debe estar entre 1 y 100'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('skip debe ser >= 0'),
  query('elderlyId')
    .optional()
    .isUUID()
    .withMessage('elderlyId debe ser un UUID válido'),
];

/**
 * Validar query opcional elderlyId (para endpoints de cuidador sin paginación)
 */
export const validateElderlyIdQuery = [
  query('elderlyId')
    .optional()
    .isUUID()
    .withMessage('elderlyId debe ser un UUID válido'),
];

/**
 * Validar query de historial de escaneos (paginación + tipo opcional)
 */
export const validateScanQuery = [
  ...validatePagination,
  query('type')
    .optional()
    .isIn(['vision', 'document'])
    .withMessage('type debe ser "vision" o "document"'),
];

/**
 * Validar ID de análisis
 */
export const validateAnalysisId = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('El ID es requerido')
    .isUUID()
    .withMessage('El ID debe ser un UUID válido'),
];

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array(),
    });
  }
  next();
};
