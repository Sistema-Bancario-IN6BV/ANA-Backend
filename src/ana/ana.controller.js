'use strict';

import { analyzeText as analyzeTextService, getHistoryFromAPI, getAnalysisByIdFromAPI, deleteAnalysisFromAPI, getEmotionStats } from './ana.service.js';
import { generateEmotionAlert } from '../alerts/alerts.service.js';
import { sendResponse } from '../../utils/responseHandler.js';


export const analyzeText = async (req, res, next) => {
    try {
        const { text } = req.body;

        if (!req.user?.id) {
            return sendResponse(res, 401, false, 'Usuario no autenticado');
        }

        const patientId = req.user.id;

        if (!text || text.trim().length === 0) {
            return sendResponse(res, 400, false, 'El texto es requerido');
        }

        // Analizar texto y detectar emoción
        const analysis = await analyzeTextService(text, patientId);

        console.log(`Análisis de ANA: emoción=${analysis.analysis.emotion}, confianza=${analysis.analysis.confidence}`);

        // Generar alerta si la emoción es negativa (sad, fear, angry, disgust, stressed, depressed, anxious)
        const negativeEmotions = ['sadness', 'fear', 'anger', 'disgust', 'stressed', 'depressed', 'anxious'];
        if (negativeEmotions.includes(analysis.analysis.emotion)) {
            console.log(`Emoción negativa detectada: ${analysis.analysis.emotion}`);
            const alert = await generateEmotionAlert(
                patientId,
                analysis.analysis.emotion,
                analysis.analysis.confidence,
                analysis.analysis
            );

            if (alert) {
                console.log(`Alerta de emoción generada: ${alert.alertType}`);
            }
        } else {
            console.log(`Emoción positiva o neutral: ${analysis.analysis.emotion}, sin alerta`);
        }

        sendResponse(res, 200, true, 'Análisis completado exitosamente', {
            ...analysis,
            messageFromANA: analysis.analysis.message
        });
    } catch (error) {
        next(error);
    }
};



export const getAnalysisHistory = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return sendResponse(res, 401, false, 'Usuario no autenticado');
        }

        const patientId = req.user.id;
        const { limit = 20, skip = 0 } = req.query;

        const history = await getHistoryFromAPI(patientId, parseInt(limit), parseInt(skip));
        sendResponse(res, 200, true, 'Historial de análisis', history);
    } catch (error) {
        next(error);
    }
};


export const getAnalysisById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const analysis = await getAnalysisByIdFromAPI(id);
        sendResponse(res, 200, true, 'Análisis encontrado', analysis);
    } catch (error) {
        next(error);
    }
};


export const deleteAnalysis = async (req, res, next) => {
    try {
        const { id } = req.params;

        await deleteAnalysisFromAPI(id);
        sendResponse(res, 200, true, 'Análisis eliminado correctamente');
    } catch (error) {
        next(error);
    }
};


export const getEmotionsStats = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return sendResponse(res, 401, false, 'Usuario no autenticado');
        }

        const patientId = req.user.id;
        const stats = await getEmotionStats(patientId);
        sendResponse(res, 200, true, 'Estadísticas de emociones', stats);
    } catch (error) {
        next(error);
    }
};
