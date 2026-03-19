'use strict';

import { body, param } from 'express-validator';
import checkValidators from './checkValidators.js';
import { validateJWT } from './auth-jwt.js';
import { REGISTERABLE_ROLES, ALLOWED_ROLES } from '../helpers/role-constants.js';

// Validadores para Auth (Registro, Login, etc.)
export const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 1, max: 25 }).withMessage('El nombre debe tener entre 1 y 25 caracteres'),
    body('surname')
        .trim()
        .notEmpty().withMessage('El apellido es requerido')
        .isLength({ min: 1, max: 25 }).withMessage('El apellido debe tener entre 1 y 25 caracteres'),
    body('username')
        .trim()
        .notEmpty().withMessage('El nombre de usuario es requerido')
        .isLength({ min: 1, max: 50 }).withMessage('El usuario debe tener entre 1 y 50 caracteres'),
    body('email')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('Correo electrónico no válido')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres'),
    body('phone')
        .trim()
        .notEmpty().withMessage('El teléfono es requerido')
        .isLength({ min: 8, max: 8 }).withMessage('El teléfono debe tener exactamente 8 dígitos')
        .isNumeric().withMessage('El teléfono solo debe contener números'),
    body('role')
        .notEmpty().withMessage('El rol es requerido')
        .isIn(REGISTERABLE_ROLES)
        .withMessage(`Rol inválido. Permitidos para registro: ${REGISTERABLE_ROLES.join(', ')}`),
    checkValidators,
];

export const validateLogin = [
    body('emailOrUsername')
        .trim()
        .notEmpty().withMessage('El email o usuario es requerido'),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida'),
    checkValidators,
];

export const validateVerifyEmail = [
    body('token')
        .trim()
        .notEmpty().withMessage('El token de verificación es requerido'),
    checkValidators,
];

export const validateResendVerification = [
    body('email')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('Correo electrónico no válido')
        .normalizeEmail(),
    checkValidators,
];

export const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('Correo electrónico no válido')
        .normalizeEmail(),
    checkValidators,
];

export const validateResetPassword = [
    body('token')
        .trim()
        .notEmpty().withMessage('El token es requerido'),
    body('newPassword')
        .notEmpty().withMessage('La nueva contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres'),
    checkValidators,
];

// Validadores para Usuarios (Rol)
export const validateUpdateRole = [
    validateJWT,
    param('userId')
        .trim()
        .notEmpty().withMessage('El ID del usuario es requerido'),
    body('roleName')
        .trim()
        .notEmpty().withMessage('El nombre del rol es requerido')
        .isIn(ALLOWED_ROLES)
        .withMessage(`Rol inválido. Use: ${ALLOWED_ROLES.join(', ')}`),
    checkValidators,
];

export const validateGetUserRoles = [
    validateJWT,
    param('userId')
        .trim()
        .notEmpty().withMessage('El ID del usuario es requerido'),
    checkValidators,
];

export const validateGetUsersByRole = [
    validateJWT,
    param('roleName')
        .trim()
        .notEmpty().withMessage('El nombre del rol es requerido')
        .isIn(ALLOWED_ROLES)
        .withMessage(`Rol inválido. Use: ${ALLOWED_ROLES.join(', ')}`),
    checkValidators,
];

export const validateGetCaregiversOfElderly = [
    validateJWT,
    param('elderlyId')
        .trim()
        .notEmpty().withMessage('El ID del adulto mayor es requerido'),
    checkValidators,
];