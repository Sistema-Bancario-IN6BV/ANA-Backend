import { asyncHandler } from '../../middlewares/server-genericError-handler.js';
import { validateJWT } from '../../middlewares/auth-jwt.js';
import { findUserById, findCaregiversByElderly } from '../../helpers/user-db.js';
import {
    getUserRoleNames,
    getUsersByRole as repoGetUsersByRole,
    setUserSingleRole,
} from '../../helpers/role-db.js';
import { ALLOWED_ROLES, ADMIN_ROLE } from '../../helpers/role-constants.js';
import { buildUserResponse } from '../../utils/user-helpers.js';
import { sequelize } from '../../configs/db.js';

const ensureAdmin = async (req) => {
    const currentUserId = req.userId;
    if (!currentUserId) return false;
    const roles =
        req.user?.UserRoles?.map((ur) => ur.Role?.Name).filter(Boolean) ??
        (await getUserRoleNames(currentUserId));
    return roles.includes(ADMIN_ROLE);
};

export const updateUserRole = [
    validateJWT,
    asyncHandler(async (req, res) => {
        if (!(await ensureAdmin(req))) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo ADMIN puede actualizar roles.',
            });
        }

        const { userId } = req.params;
        const { roleName } = req.body || {};

        const normalized = (roleName || '').trim().toUpperCase();
        if (!ALLOWED_ROLES.includes(normalized)) {
            return res.status(400).json({
                success: false,
                message: `Rol no permitido. Use: ${ALLOWED_ROLES.join(', ')}`,
            });
        }

        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
            });
        }

        const { updatedUser } = await setUserSingleRole(
            user,
            normalized,
            sequelize
        );

        return res.status(200).json({
            success: true,
            message: 'Rol actualizado correctamente',
            data: buildUserResponse(updatedUser),
        });
    }),
];

export const getUserRoles = [
    validateJWT,
    asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
            });
        }

        const roles = await getUserRoleNames(userId);
        return res.status(200).json({
            success: true,
            data: roles,
        });
    }),
];

export const getUsersByRole = [
    validateJWT,
    asyncHandler(async (req, res) => {
        if (!(await ensureAdmin(req))) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo ADMIN puede ver usuarios por rol.',
            });
        }

        const { roleName } = req.params;
        const normalized = (roleName || '').trim().toUpperCase();
        if (!ALLOWED_ROLES.includes(normalized)) {
            return res.status(400).json({
                success: false,
                message: `Rol no permitido. Use: ${ALLOWED_ROLES.join(', ')}`,
            });
        }

        const users = await repoGetUsersByRole(normalized);
        return res.status(200).json({
            success: true,
            data: users.map((u) => buildUserResponse(u)),
        });
    }),
];

export const getCaregiversOfElderly = [
    validateJWT,
    asyncHandler(async (req, res) => {
        const { elderlyId } = req.params;

        const elderly = await findUserById(elderlyId);
        if (!elderly) {
            return res.status(404).json({
                success: false,
                message: 'Adulto mayor no encontrado',
            });
        }

        const caregivers = await findCaregiversByElderly(elderlyId);
        return res.status(200).json({
            success: true,
            message: 'Cuidadores obtenidos correctamente',
            data: caregivers.map((c) => buildUserResponse(c)),
        });
    }),
];
