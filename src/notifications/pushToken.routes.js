'use strict';

import { Router } from 'express';
import { registerToken } from './pushToken.controller.js';
import { validateRegisterToken } from '../../middlewares/pushToken-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post('/', validateJWT, validateRegisterToken, registerToken);

export default router;
