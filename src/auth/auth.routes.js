import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateJWT } from '../../middlewares/auth-jwt.js';
import {
  authRateLimit,
  requestLimit,
} from '../../middlewares/request-limit.js';
import { upload, handleUploadError } from '../../helpers/file-upload.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword,
} from '../../middlewares/user-validators.js';

const router = Router();

router.post(
  '/register',
  authRateLimit,
  upload.single('profilePicture'),
  handleUploadError,
  validateRegister,
  authController.register
);

router.post('/login', authRateLimit, validateLogin, authController.login);

router.post(
  '/verify-email',
  requestLimit, // Match .NET ApiPolicy (20 tokens per minute)
  validateVerifyEmail,
  authController.verifyEmail
);

router.post(
  '/resend-verification',
  authRateLimit, // Match .NET AuthPolicy (5 req/min)
  validateResendVerification,
  authController.resendVerification
);


router.post(
  '/forgot-password',
  authRateLimit, // Match .NET AuthPolicy (5 req/min)
  validateForgotPassword,
  authController.forgotPassword
);


router.post(
  '/reset-password',
  authRateLimit,
  validateResetPassword,
  authController.resetPassword
);


router.get('/profile', validateJWT, authController.getProfile);

router.post('/profile/by-id', requestLimit, authController.getProfileById);

router.get('/elderly', ...authController.getElderly);

export default router;
