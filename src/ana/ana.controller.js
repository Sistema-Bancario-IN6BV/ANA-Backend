'use strict';

import { 
    analyzeText as analyzeTextService,
    getHistoryFromAPI,
    getAnalysisByIdFromAPI,
    deleteAnalysisFromAPI,
    getEmotionStats
} from './ana.service.js';

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

        const result = await analyzeTextService(text, patientId);

        const emotion = result.analysis.emotion;
        const confidence = result.analysis.confidence;

        const negativeEmotions = [
            'sadness',
            'fear',
            'anger',
            'disgust',
            'stressed',
            'depressed',
            'anxious'
        ];

        if (negativeEmotions.includes(emotion)) {

            const alert = await generateEmotionAlert(
                patientId,
                emotion,
                confidence,
                result.analysis
            );

            if (alert) {
                console.log(`Alerta generada: ${alert.alertType}`);
            }
        } else {
            console.log(`Emoción no crítica: ${emotion}`);
        }

        return sendResponse(res, 200, true, 'Análisis completado exitosamente', {
            ...result,
            messageFromANA: result.analysis.message || 'Mensaje no disponible'
        });

    } catch (error) {
        console.error('Error en controller analyzeText:', error);
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

        const history = await getHistoryFromAPI(
            patientId, 
            parseInt(limit), 
            parseInt(skip)
        );

        return sendResponse(res, 200, true, 'Historial de análisis', history);

    } catch (error) {
        console.error('Error en getAnalysisHistory:', error);
        next(error);
    }
};


export const getAnalysisById = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return sendResponse(res, 401, false, 'Usuario no autenticado');
        }

        const { id } = req.params;

        const analysis = await getAnalysisByIdFromAPI(id);

        // Verificar existencia del análisis
        if (!analysis) {
            return sendResponse(res, 404, false, 'Análisis no encontrado');
        }

        // Verificar autorización: el análisis debe pertenecer al usuario
        if (analysis.elderly !== req.user.id && req.user.role !== 'ADMIN_ROLE') {
            return sendResponse(res, 403, false, 'No tienes permiso para acceder a este análisis');
        }

        return sendResponse(res, 200, true, 'Análisis encontrado', analysis);

    } catch (error) {
        console.error('Error en getAnalysisById:', error);
        next(error);
    }
};


export const deleteAnalysis = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return sendResponse(res, 401, false, 'Usuario no autenticado');
        }

        const { id } = req.params;

        // Verificar que el análisis existe y obtener su propietario
        const analysis = await getAnalysisByIdFromAPI(id);
        
        if (!analysis) {
            return sendResponse(res, 404, false, 'Análisis a eliminar no existe');
        }

        // Verificar autorización: solo el propietario o admin pueden eliminar
        if (analysis.elderly !== req.user.id && req.user.role !== 'ADMIN_ROLE') {
            return sendResponse(res, 403, false, 'No tienes permiso para eliminar este análisis');
        }

        await deleteAnalysisFromAPI(id);

        return sendResponse(res, 200, true, 'Análisis eliminado correctamente');

    } catch (error) {
        console.error('Error en deleteAnalysis:', error);
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

        return sendResponse(res, 200, true, 'Estadísticas de emociones', stats);

    } catch (error) {
        console.error('Error en getEmotionsStats:', error);
        next(error);
    }
};