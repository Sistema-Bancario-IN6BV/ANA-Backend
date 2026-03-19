import { Router } from 'express';
import {
    updateUserRole,
    getUserRoles,
    getUsersByRole,
    getCaregiversOfElderly,
} from './user.controller.js';
import {
    validateUpdateRole,
    validateGetUserRoles,
    validateGetUsersByRole,
    validateGetCaregiversOfElderly,
} from '../../middlewares/user-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';

const router = Router();

router.put('/:userId/role', validateJWT, requireRole('ADMIN_ROLE'), validateUpdateRole, updateUserRole);

router.get('/:userId/roles', validateJWT, validateGetUserRoles, getUserRoles);

router.get('/by-role/:roleName', validateJWT, validateGetUsersByRole, getUsersByRole);

router.get('/elderly/:elderlyId/caregivers', validateJWT, validateGetCaregiversOfElderly, getCaregiversOfElderly);

export default router;
