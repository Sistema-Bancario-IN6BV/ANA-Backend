'use strict';

import { Router } from 'express';
import multer from 'multer';
import {
    analyzeText,
    analyzeVoice,
    analyzeVoiceSpeak,
    detectObjects,
    readDocument,
    getScans,
    getWeeklySummary,
    getAnalysisHistory,
    getAnalysisById,
    deleteAnalysis,
    getEmotionsStats,
} from './ana.controller.js';
import {
    validateTextInput,
    validateAnalysisId,
    validatePagination,
    validateElderlyIdQuery,
    validateScanQuery,
    handleValidationErrors,
} from '../../middlewares/ana-validators.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { voiceRateLimit } from '../../middlewares/request-limit.js';

const router = Router();

// Multer en memoria para reenviar audio a Python
const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 25 * 1024 * 1024 }, // 25MB máx (límite de Whisper)
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/mpeg', 'audio/mp4', 'audio/wav',
                         'audio/webm', 'audio/ogg', 'audio/m4a',
                         'audio/x-m4a', 'video/mp4'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Formato de audio no soportado: ${file.mimetype}`), false);
        }
    },
});

// Multer en memoria para reenviar imágenes de escena a Python (detección de objetos)
const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB máx
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Formato de imagen no soportado: ${file.mimetype}`), false);
        }
    },
});

// Multer en memoria para reenviar documentos (PDF/imagen) a Python (OCR)
const uploadDocument = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB máx
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff', 'image/bmp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Formato de documento no soportado: ${file.mimetype}`), false);
        }
    },
});

// ── Texto ─────────────────────────────────────
router.post(
    '/analyze',
    validateJWT,
    validateTextInput,
    handleValidationErrors,
    analyzeText
);

// ── Voz → JSON ────────────────────────────────
router.post(
    '/voice',
    validateJWT,
    voiceRateLimit,
    upload.single('audio'),
    analyzeVoice
);

// ── Voz → MP3 (ANA habla) ────────────────────
router.post(
    '/voice/speak',
    validateJWT,
    voiceRateLimit,
    upload.single('audio'),
    analyzeVoiceSpeak
);

// ── Visión → detección de objetos/riesgos ────
router.post(
    '/vision/detect',
    validateJWT,
    voiceRateLimit,
    uploadImage.single('file'),
    detectObjects
);

// ── Documentos → OCR + entidades de salud ────
router.post(
    '/documents/read',
    validateJWT,
    voiceRateLimit,
    uploadDocument.single('file'),
    readDocument
);

// ── Historial de escaneos ─────────────────────
router.get(
    '/scans',
    validateJWT,
    validateScanQuery,
    handleValidationErrors,
    getScans
);

// ── Resumen semanal ───────────────────────────
router.get(
    '/summary',
    validateJWT,
    validateElderlyIdQuery,
    handleValidationErrors,
    getWeeklySummary
);

// ── Historial ─────────────────────────────────
router.get(
    '/history',
    validateJWT,
    validatePagination,
    handleValidationErrors,
    getAnalysisHistory
);

// ── Estadísticas ──────────────────────────────
router.get(
    '/stats/emotions',
    validateJWT,
    validateElderlyIdQuery,
    handleValidationErrors,
    getEmotionsStats
);

// ── Por ID ────────────────────────────────────
router.get(
    '/:id',
    validateJWT,
    validateAnalysisId,
    handleValidationErrors,
    getAnalysisById
);

// ── Eliminar ──────────────────────────────────
router.delete(
    '/:id',
    validateJWT,
    validateAnalysisId,
    handleValidationErrors,
    deleteAnalysis
);

export default router;