'use strict';

import { Router } from 'express';
import { createRecord, getRecords, getRecordById, changeStatus } from './glucose.controller.js';
import {
    validateCreate,
    validateStatusChange,
    validateGetById
} from '../../middlewares/glucose-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post('/create', validateJWT, validateCreate, createRecord);
router.get('/get', validateJWT, getRecords);
router.get('/:id', validateJWT, validateGetById, getRecordById);
router.put('/:id/activate', validateJWT, validateStatusChange, changeStatus);
router.put('/:id/deactivate', validateJWT, validateStatusChange, changeStatus);

export default router;