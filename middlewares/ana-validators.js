'use strict';

import { body, param, validationResult } from 'express-validator';

/**
 * Validar entrada de texto para análisis
 */
export const validateTextInput = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('El texto es requerido')
    .isLength({ min: 3, max: 5000 })
    .withMessage('El texto debe tener entre 3 y 5000 caracteres'),
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
