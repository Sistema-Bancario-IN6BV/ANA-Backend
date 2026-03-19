'use strict';

import axios from 'axios';
import Analysis from './ana.model.js';

// URL de la API de ANA-IA-Engine (puede configurarse desde variables de entorno)
const ANA_API_URL = process.env.ANA_API_URL || 'http://localhost:8000';
const ANALYZE_ENDPOINT = `${ANA_API_URL}/analyze`;
const CHAT_ENDPOINT = `${ANA_API_URL}/chat`;
const HEALTH_ENDPOINT = `${ANA_API_URL}/health`;

export const analyzeText = async (text, elderlyId) => {
    try {
        // Verificar que el servicio ANA esté disponible
        await checkANAHealth();

        // Llamar al servicio de análisis de ANA-IA-Engine
        const response = await axios.post(ANALYZE_ENDPOINT, { text }, {
            timeout: 30000, // 30 segundos timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const analysisData = response.data;

        // Crear documento de análisis
        const analysis = new Analysis({
            elderly: elderlyId,
            text,
            analysis: {
                sentiment_label: analysisData.sentiment_label || 'neutral',
                emotion_model: analysisData.emotion_model || null,
                emotion_score: analysisData.emotion_score || 0,
                emotional_state: mapEmotionToSpanish(analysisData.emotional_state || 'neutral'),
                semantic_state: analysisData.semantic_state || null,
                semantic_confidence: analysisData.semantic_confidence || 0,
                context: analysisData.context || null,
                risk_level: analysisData.risk_level || 'bajo',
                keywords: analysisData.keywords || [],
                trend: analysisData.trend || 'stable',
                message: analysisData.message || null,
                confidence: analysisData.emotion_score || 0
            },
            response: analysisData.response || null,
            alertGenerated: false,
            isActive: true
        });

        // Guardar análisis en la base de datos
        const savedAnalysis = await analysis.save();

        return {
            success: true,
            analysisId: savedAnalysis._id,
            analysis: {
                emotion: mapEmotionToEnglish(savedAnalysis.analysis.emotional_state),
                confidence: savedAnalysis.analysis.confidence,
                sentiment: savedAnalysis.analysis.sentiment_label,
                riskLevel: savedAnalysis.analysis.risk_level,
                message: savedAnalysis.analysis.message,
                keywords: savedAnalysis.analysis.keywords,
                trend: savedAnalysis.analysis.trend
            },
            timestamp: savedAnalysis.createdAt
        };
    } catch (error) {
        console.error('Error en analyzeText:', error.message);
        throw new Error(`Error al analizar texto: ${error.message}`);
    }
};


export const getHistoryFromAPI = async (elderlyId, limit = 20, skip = 0) => {
    try {
        const analyses = await Analysis.find(
            { elderly: elderlyId, isActive: true },
            {
                text: 1,
                'analysis.emotional_state': 1,
                'analysis.confidence': 1,
                'analysis.risk_level': 1,
                'analysis.trend': 1,
                createdAt: 1
            }
        )
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Analysis.countDocuments({
            elderly: elderlyId,
            isActive: true
        });

        return {
            success: true,
            data: analyses,
            pagination: {
                total,
                limit,
                skip,
                hasMore: skip + limit < total
            }
        };
    } catch (error) {
        console.error('Error en getHistoryFromAPI:', error.message);
        throw new Error(`Error al obtener historial: ${error.message}`);
    }
};


export const getAnalysisByIdFromAPI = async (analysisId) => {
    try {
        const analysis = await Analysis.findById(analysisId);

        if (!analysis) {
            throw new Error('Análisis no encontrado');
        }

        return {
            success: true,
            data: analysis
        };
    } catch (error) {
        console.error('Error en getAnalysisByIdFromAPI:', error.message);
        throw new Error(`Error al obtener análisis: ${error.message}`);
    }
};


export const deleteAnalysisFromAPI = async (analysisId) => {
    try {
        const analysis = await Analysis.findByIdAndUpdate(
            analysisId,
            { isActive: false },
            { new: true }
        );

        if (!analysis) {
            throw new Error('Análisis no encontrado');
        }

        return {
            success: true,
            message: 'Análisis eliminado correctamente'
        };
    } catch (error) {
        console.error('Error en deleteAnalysisFromAPI:', error.message);
        throw new Error(`Error al eliminar análisis: ${error.message}`);
    }
};

export const getEmotionStats = async (elderlyId) => {
    try {
        const stats = await Analysis.aggregate([
            { $match: { elderly: elderlyId, isActive: true } },
            {
                $group: {
                    _id: '$analysis.emotional_state',
                    count: { $sum: 1 },
                    avgConfidence: { $avg: '$analysis.confidence' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const total = await Analysis.countDocuments({
            elderly: elderlyId,
            isActive: true
        });

        return {
            success: true,
            data: stats,
            total
        };
    } catch (error) {
        console.error('Error en getEmotionStats:', error.message);
        throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
};

export const checkANAHealth = async () => {
    try {
        const response = await axios.get(HEALTH_ENDPOINT, {
            timeout: 5000 // 5 segundos timeout
        });

        if (response.status !== 200) {
            throw new Error('Servicio ANA no disponible');
        }

        return {
            success: true,
            status: response.data
        };
    } catch (error) {
        console.error('Error checking ANA health:', error.message);
        throw new Error(`Servicio ANA no disponible: ${error.message}`);
    }
};

function mapEmotionToSpanish(emotion) {
    const emotionMap = {
        'joy': 'alegria',
        'sadness': 'tristeza',
        'fear': 'miedo',
        'anger': 'ira',
        'disgust': 'disgust',
        'surprise': 'sorpresa',
        'stressed': 'estresado',
        'depressed': 'deprimido',
        'anxious': 'ansioso',
        'neutral': 'neutral',
        'sad': 'tristeza',
        'angry': 'ira'
    };

    return emotionMap[emotion?.toLowerCase()] || 'neutral';
}


function mapEmotionToEnglish(emotion) {
    const emotionMap = {
        'alegria': 'joy',
        'tristeza': 'sadness',
        'miedo': 'fear',
        'ira': 'anger',
        'disgust': 'disgust',
        'sorpresa': 'surprise',
        'estresado': 'stressed',
        'deprimido': 'depressed',
        'ansioso': 'anxious',
        'neutral': 'neutral'
    };

    return emotionMap[emotion?.toLowerCase()] || 'neutral';
}
