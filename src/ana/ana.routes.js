'use strict';

import { Router } from 'express';
import {
    analyzeText,
    getAnalysisHistory,
    getAnalysisById,
    deleteAnalysis,
    getEmotionsStats
} from './ana.controller.js';
import { validateTextInput, validateAnalysisId, validatePagination, handleValidationErrors } from '../../middlewares/ana-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post(
    '/analyze',
    validateJWT,
    validateTextInput,
    handleValidationErrors,
    analyzeText
);

router.get(
    '/history',
    validateJWT,
    validatePagination,
    handleValidationErrors,
    getAnalysisHistory
);

router.get(
    '/stats/emotions',
    validateJWT,
    getEmotionsStats
);

router.get(
    '/:id',
    validateJWT,
    validateAnalysisId,
    handleValidationErrors,
    getAnalysisById
);

router.delete(
    '/:id',
    validateJWT,
    validateAnalysisId,
    handleValidationErrors,
    deleteAnalysis
);

export default router;
