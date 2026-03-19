'use strict';

import { Router } from 'express';
import { createRecord, getRecords, getRecordById, changeStatus } from './bloodPressure.controller.js';
import {
    validateCreate,
    validateStatusChange,
    validateGetById
} from '../../middlewares/bloodPressure-validators.js';

const router = Router();

router.post('/create', validateCreate, createRecord);
router.get('/get', getRecords);
router.get('/:id', validateGetById, getRecordById);
router.put('/:id/activate', validateStatusChange, changeStatus);
router.put('/:id/deactivate', validateStatusChange, changeStatus);

export default router;