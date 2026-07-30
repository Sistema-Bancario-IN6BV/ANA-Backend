'use strict';

import axios from 'axios';
import FormData from 'form-data';
import {
    analyzeText as analyzeTextService,
    getHistoryFromAPI,
    getAnalysisByIdFromAPI,
    deleteAnalysisFromAPI,
    getEmotionStats,
    saveScan,
    getScanHistory
} from './ana.service.js';
import { generateEmotionAlert, generateCrisisAlert, generateFallRiskAlert } from '../alerts/alerts.service.js';
import CaregiverLink from '../caregivers/caregivers.model.js';
import { sendResponse } from '../../utils/responseHandler.js';
import { config } from '../../configs/config.js';

const ANA_API_URL = config.ana.apiUrl;
const ANA_API_TIMEOUT = config.ana.requestTimeoutMs;

// ──────────────────────────────────────────────
// HELPER — resolver a qué abuelo puede acceder el solicitante
// (el propio abuelo, su cuidador vinculado, o un admin)
// ──────────────────────────────────────────────
const resolveTargetElderly = async (req, res) => {
    const { elderlyId } = req.query;
    if (!elderlyId || elderlyId === req.user.id) return req.user.id;

    if (req.user.role === 'ADMIN_ROLE') return elderlyId;

    if (req.user.role === 'CAREGIVER_ROLE') {
        const link = await CaregiverLink.findOne({
            caregiver: req.user.id,
            elderly: elderlyId,
            isActive: true,
        });
        if (link) return elderlyId;
    }

    sendResponse(res, 403, false, 'No tienes permiso para ver la información de este usuario');
    return null;
};

// ──────────────────────────────────────────────
// HELPER — manejar alertas según riesgo
// ──────────────────────────────────────────────
const handleAlerts = async (patientId, result) => {
    const emotion    = result.analysis?.emotion;
    const confidence = result.analysis?.confidence;
    const riskLevel  = result.analysis?.riskLevel;

    if (riskLevel === 'critico') {
        const crisisAlert = await generateCrisisAlert(patientId, result);
        if (crisisAlert) console.log(`🚨 ALERTA CRÍTICA generada: ${crisisAlert.alertType}`);
        return;
    }

    // Riesgo alto: escalar al cuidador aunque la emoción detectada no sea "negativa"
    // (p. ej. semantic similarity o dimensiones de riesgo pueden elevar el nivel sin
    // que la emoción dominante caiga en la lista de negativas de abajo).
    if (riskLevel === 'alto') {
        const riskAlert = await generateEmotionAlert(patientId, emotion || 'riesgo_alto', confidence || 0, result.analysis);
        if (riskAlert) console.log(`⚠️ Alerta de riesgo alto generada: ${riskAlert.alertType}`);
        return;
    }

    const negativeEmotions = ['sadness', 'fear', 'anger', 'disgust', 'stressed', 'depressed', 'anxious'];
    if (negativeEmotions.includes(emotion)) {
        const alert = await generateEmotionAlert(patientId, emotion, confidence, result.analysis);
        if (alert) console.log(`⚠️ Alerta generada: ${alert.alertType}`);
    }
};

// ──────────────────────────────────────────────
// POST /ana/analyze — Texto → análisis JSON
// ──────────────────────────────────────────────
export const analyzeText = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');

        const { text } = req.body;
        if (!text?.trim()) return sendResponse(res, 400, false, 'El texto es requerido');

        const result = await analyzeTextService(text, req.user.id);
        await handleAlerts(req.user.id, result);

        return sendResponse(res, 200, true, 'Análisis completado exitosamente', {
            ...result,
            messageFromANA: result.analysis.message || 'Mensaje no disponible'
        });
    } catch (error) {
        console.error('Error en analyzeText:', error);
        next(error);
    }
};

// ──────────────────────────────────────────────
// POST /ana/voice — Audio → análisis JSON
// ──────────────────────────────────────────────
export const analyzeVoice = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        if (!req.file)     return sendResponse(res, 400, false, 'Audio requerido');

        const elderlyId = req.user.id;

        // Reenviar audio a Python
        const form = new FormData();
        form.append('audio', req.file.buffer, {
            filename:    req.file.originalname || 'audio.mp3',
            contentType: req.file.mimetype     || 'audio/mpeg',
        });

        const { data } = await axios.post(`${ANA_API_URL}/voice-chat`, form, {
            headers: {
                ...form.getHeaders(),
                'X-Elderly-Id': elderlyId,
            },
            timeout: ANA_API_TIMEOUT,
        });

        // Si no detectó wake word
        if (!data.wake_word_detected) {
            return sendResponse(res, 200, true, 'Wake word no detectada', {
                wake_word_detected: false,
                transcription:      data.transcription,
            });
        }

        // Manejar alertas
        if (data.analysis) {
            const mapped = {
                analysis: {
                    emotion:    data.analysis.emotion,
                    confidence: 0,
                    riskLevel:  data.analysis.risk_level,
                }
            };
            await handleAlerts(elderlyId, mapped);
        }

        return sendResponse(res, 200, true, 'Análisis de voz completado', data);

    } catch (error) {
        console.error('Error en analyzeVoice:', error.message);
        next(error);
    }
};

// ──────────────────────────────────────────────
// POST /ana/voice/speak — Audio → MP3 con voz de ANA
// ──────────────────────────────────────────────
export const analyzeVoiceSpeak = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        if (!req.file)     return sendResponse(res, 400, false, 'Audio requerido');

        const elderlyId = req.user.id;

        const form = new FormData();
        form.append('audio', req.file.buffer, {
            filename:    req.file.originalname || 'audio.mp3',
            contentType: req.file.mimetype     || 'audio/mpeg',
        });

        const response = await axios.post(`${ANA_API_URL}/voice-chat/speak`, form, {
            headers: {
                ...form.getHeaders(),
                'X-Elderly-Id': elderlyId,
            },
            timeout:      ANA_API_TIMEOUT,
            responseType: 'arraybuffer',  // recibir audio binario
        });

        const wakeWordDetected = response.headers['x-wake-word'];

        if (wakeWordDetected === 'false') {
            return sendResponse(res, 200, true, 'Wake word no detectada', {
                wake_word_detected: false,
            });
        }

        // Devolver el MP3 directamente al cliente con todos los metadatos
        res.set({
            'Content-Type':      'audio/mpeg',
            'X-Wake-Word':       'true',
            'X-Emotion':         response.headers['x-emotion']       || 'neutral',
            'X-Risk':            response.headers['x-risk']          || 'bajo',
            'X-Language':        response.headers['x-language']      || 'es',
            'X-Transcription':   response.headers['x-transcription'] || '',
            'X-Response':        response.headers['x-response']      || '',
        });
        return res.send(Buffer.from(response.data));

    } catch (error) {
        console.error('Error en analyzeVoiceSpeak:', error.message);
        next(error);
    }
};

// ──────────────────────────────────────────────
// POST /ana/vision/detect — Imagen → objetos/riesgos detectados
// ──────────────────────────────────────────────
export const detectObjects = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        if (!req.file)     return sendResponse(res, 400, false, 'Imagen requerida');

        const elderlyId = req.user.id;

        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename:    req.file.originalname || 'scene.jpg',
            contentType: req.file.mimetype     || 'image/jpeg',
        });

        const { data } = await axios.post(`${ANA_API_URL}/api/v1/vision/detect`, form, {
            headers: form.getHeaders(),
            timeout: ANA_API_TIMEOUT,
        });

        await saveScan(elderlyId, 'vision', data).catch((err) =>
            console.error('Error guardando escaneo de visión:', err.message)
        );

        if (data?.fall_risk_detected) {
            const fallRiskAlert = await generateFallRiskAlert(elderlyId, data.summary);
            if (fallRiskAlert) console.log(`⚠️ Alerta de riesgo de caída generada: ${fallRiskAlert.alertType}`);
        }

        return sendResponse(res, 200, true, 'Análisis de escena completado', data);
    } catch (error) {
        console.error('Error en detectObjects:', error.message);
        next(error);
    }
};

// ──────────────────────────────────────────────
// POST /ana/documents/read — PDF/imagen → texto + entidades de salud
// ──────────────────────────────────────────────
export const readDocument = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        if (!req.file)     return sendResponse(res, 400, false, 'Documento requerido');

        const elderlyId = req.user.id;

        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename:    req.file.originalname || 'document.pdf',
            contentType: req.file.mimetype     || 'application/pdf',
        });

        const { data } = await axios.post(`${ANA_API_URL}/api/v1/documents/read`, form, {
            headers: form.getHeaders(),
            timeout: ANA_API_TIMEOUT,
        });

        await saveScan(elderlyId, 'document', data).catch((err) =>
            console.error('Error guardando escaneo de documento:', err.message)
        );

        return sendResponse(res, 200, true, 'Documento leído correctamente', data);
    } catch (error) {
        console.error('Error en readDocument:', error.message);
        next(error);
    }
};

// ──────────────────────────────────────────────
// GET /ana/scans — Historial de escaneos (visión/documentos)
// ──────────────────────────────────────────────
export const getScans = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        const targetId = await resolveTargetElderly(req, res);
        if (!targetId) return;

        const { limit = 20, skip = 0, type } = req.query;
        const scans = await getScanHistory(targetId, type, parseInt(limit), parseInt(skip));
        return sendResponse(res, 200, true, 'Historial de escaneos', scans);
    } catch (error) {
        console.error('Error en getScans:', error);
        next(error);
    }
};

// ──────────────────────────────────────────────
// GET /ana/summary — Resumen semanal para el cuidador
// ──────────────────────────────────────────────
export const getWeeklySummary = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        const targetId = await resolveTargetElderly(req, res);
        if (!targetId) return;

        const { data } = await axios.get(
            `${ANA_API_URL}/summary/${targetId}`,
            { timeout: ANA_API_TIMEOUT }
        );

        return sendResponse(res, 200, true, 'Resumen semanal generado', data);
    } catch (error) {
        console.error('Error en getWeeklySummary:', error.message);
        next(error);
    }
};

// ──────────────────────────────────────────────
// GET /ana/history
// ──────────────────────────────────────────────
export const getAnalysisHistory = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        const targetId = await resolveTargetElderly(req, res);
        if (!targetId) return;

        const { limit = 20, skip = 0 } = req.query;
        const history = await getHistoryFromAPI(targetId, parseInt(limit), parseInt(skip));
        return sendResponse(res, 200, true, 'Historial de análisis', history);
    } catch (error) {
        console.error('Error en getAnalysisHistory:', error);
        next(error);
    }
};

// ──────────────────────────────────────────────
// GET /ana/:id
// ──────────────────────────────────────────────
export const getAnalysisById = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        const analysis = await getAnalysisByIdFromAPI(req.params.id);
        if (!analysis) return sendResponse(res, 404, false, 'Análisis no encontrado');
        if (analysis.elderly !== req.user.id && req.user.role !== 'ADMIN_ROLE')
            return sendResponse(res, 403, false, 'No tienes permiso para acceder a este análisis');
        return sendResponse(res, 200, true, 'Análisis encontrado', analysis);
    } catch (error) {
        console.error('Error en getAnalysisById:', error);
        next(error);
    }
};

// ──────────────────────────────────────────────
// DELETE /ana/:id
// ──────────────────────────────────────────────
export const deleteAnalysis = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        const analysis = await getAnalysisByIdFromAPI(req.params.id);
        if (!analysis) return sendResponse(res, 404, false, 'Análisis a eliminar no existe');
        if (analysis.elderly !== req.user.id && req.user.role !== 'ADMIN_ROLE')
            return sendResponse(res, 403, false, 'No tienes permiso para eliminar este análisis');
        await deleteAnalysisFromAPI(req.params.id);
        return sendResponse(res, 200, true, 'Análisis eliminado correctamente');
    } catch (error) {
        console.error('Error en deleteAnalysis:', error);
        next(error);
    }
};

// ──────────────────────────────────────────────
// GET /ana/stats/emotions
// ──────────────────────────────────────────────
export const getEmotionsStats = async (req, res, next) => {
    try {
        if (!req.user?.id) return sendResponse(res, 401, false, 'Usuario no autenticado');
        const targetId = await resolveTargetElderly(req, res);
        if (!targetId) return;

        const stats = await getEmotionStats(targetId);
        return sendResponse(res, 200, true, 'Estadísticas de emociones', stats);
    } catch (error) {
        console.error('Error en getEmotionsStats:', error);
        next(error);
    }
};