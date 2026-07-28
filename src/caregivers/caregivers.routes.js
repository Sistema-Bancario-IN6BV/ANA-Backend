'use strict';

import { Router } from 'express';
import { createLink, getLinks, getLinkById, updateLink, changeStatus } from './caregivers.controller.js';
import {
    validateCreate,
    validateUpdate,
    validateStatusChange,
    validateGetById
} from '../../middlewares/caregiver-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post('/create', validateJWT, validateCreate, createLink);
router.get('/get', validateJWT, getLinks);
router.get('/:id', validateJWT, validateGetById, getLinkById);
router.put('/:id', validateJWT, validateUpdate, updateLink);
router.put('/:id/activate', validateJWT, validateStatusChange, changeStatus);
router.put('/:id/deactivate', validateJWT, validateStatusChange, changeStatus);

export default router;