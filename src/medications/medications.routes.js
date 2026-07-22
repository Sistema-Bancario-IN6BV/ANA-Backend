'use strict';

import { Router } from 'express';
import { createRecord, getRecords, getRecordById, updateRecord, changeStatus, markAsTaken, getLogs } from './medications.controller.js';
import {
    validateCreate,
    validateUpdate,
    validateStatusChange,
    validateGetById,
    validateTake,
    validateGetLogs
} from '../../middlewares/medication-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post('/create', validateJWT, validateCreate, createRecord);
router.get('/get', validateJWT, getRecords);
router.post('/:id/take', validateJWT, validateTake, markAsTaken);
router.get('/:id/logs', validateJWT, validateGetLogs, getLogs);
router.get('/:id', validateJWT, validateGetById, getRecordById);
router.put('/:id', validateJWT, validateUpdate, updateRecord);
router.put('/:id/activate', validateJWT, validateStatusChange, changeStatus);
router.put('/:id/deactivate', validateJWT, validateStatusChange, changeStatus);

export default router;
