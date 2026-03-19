'use strict';

import { Router } from 'express';
import { createLink, getLinks, getLinkById, updateLink, changeStatus } from './caregivers.controller.js';
import {
    validateCreate,
    validateUpdate,
    validateStatusChange,
    validateGetById
} from '../../middlewares/caregiver-validators.js';

const router = Router();

router.post('/create', validateCreate, createLink);
router.get('/get', getLinks);
router.get('/:id', validateGetById, getLinkById);
router.put('/:id', validateUpdate, updateLink);
router.put('/:id/activate', validateStatusChange, changeStatus);
router.put('/:id/deactivate', validateStatusChange, changeStatus);

export default router;