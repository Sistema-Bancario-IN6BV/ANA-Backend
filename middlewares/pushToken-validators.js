'use strict';

import { body } from 'express-validator';
import checkValidators from './checkValidators.js';
import { validateJWT } from './auth-jwt.js';

export const validateRegisterToken = [
    validateJWT,
    body('token')
        .notEmpty().withMessage('El token es requerido')
        .isString().withMessage('El token debe ser una cadena')
        .isLength({ max: 400 }).withMessage('Token inválido'),
    checkValidators,
];
