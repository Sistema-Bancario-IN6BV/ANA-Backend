'use strict';

import { User, UserProfile, UserEmail, UserPasswordReset } from '../src/users/user.model.js';
import { Role, UserRole } from '../src/auth/role.model.js';
import { hashPassword } from '../utils/password-utils.js';
import { ADMIN_ROLE } from '../helpers/role-constants.js';

/**
 * Seed del usuario administrador
 * Se ejecuta automáticamente al iniciar la app
 */
export const seedAdminUser = async () => {
  try {
    // Verificar si el admin ya existe
    const adminExists = await User.findOne({
      where: { Username: 'admin' },
    });

    if (adminExists) {
      console.log('ℹ️  Admin user already exists');
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword('AdminANA789@');

    // Crear el usuario
    const adminUser = await User.create({
      Name: 'Admin',
      Surname: 'Sistema',
      Username: 'admin',
      Email: 'admin@anaapp.com',
      Password: hashedPassword,
      Status: true,
    });

    // Crear el perfil del usuario
    await UserProfile.create({
      UserId: adminUser.Id,
      Phone: '12345678',
      ProfilePicture: '',
    });

    // Crear el registro de email (marcado como verificado)
    await UserEmail.create({
      UserId: adminUser.Id,
      EmailVerified: true,
    });

    // Crear el registro de reset de contraseña
    await UserPasswordReset.create({
      UserId: adminUser.Id,
    });

    // Buscar el rol ADMIN_ROLE y asignarlo
    const adminRole = await Role.findOne({
      where: { Name: ADMIN_ROLE },
    });

    if (adminRole) {
      await UserRole.create({
        UserId: adminUser.Id,
        RoleId: adminRole.Id,
      });
    }

    console.log('✓ Admin user created');
    console.log('  Username: admin');
    console.log('  Email: admin@anaapp.com');
    console.log('  Password: AdminANA789@');
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};
