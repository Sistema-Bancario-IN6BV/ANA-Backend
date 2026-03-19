'use strict';

import axios from 'axios';
import Analysis from './ana.model.js';

const ANA_API_URL = process.env.ANA_API_URL || 'http://localhost:8000';
const ANALYZE_ENDPOINT = `${ANA_API_URL}/analyze`;
const HEALTH_ENDPOINT = `${ANA_API_URL}/health`;


export const analyzeText = async (text, elderlyId) => {
    try {
        await checkANAHealth();

        const { data: analysisData } = await axios.post(
            ANALYZE_ENDPOINT,
            { text },
            {
                timeout: 60000,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const rawAnalysis = analysisData.analysis || analysisData;
        
        const emotionalState = rawAnalysis.emotional_state || 
                               mapEmotionToSpanish(
                                   rawAnalysis.emotion_dict ||
                                   rawAnalysis.emotion_model ||
                                   rawAnalysis.emotion ||
                                   'neutral'
                               );

        const riskLevel = normalizeRiskToSpanish(
            rawAnalysis.risk_level || 'bajo'
        );

        const analysis = new Analysis({
            elderly: elderlyId,
            text,
            analysis: {
                sentiment_label: rawAnalysis.sentiment_label || rawAnalysis.sentiment || 'neutral',
                emotion_model: rawAnalysis.emotion_model || rawAnalysis.emotion || null,
                emotion_score: rawAnalysis.emotion_score || 0,
                emotional_state: emotionalState,
                semantic_state: rawAnalysis.semantic_state || null,
                semantic_confidence: rawAnalysis.semantic_confidence || 0,
                context: rawAnalysis.context || null,
                risk_level: riskLevel,
                keywords: rawAnalysis.keywords || [],
                trend: rawAnalysis.trend || 'stable',
                message: rawAnalysis.message || analysisData.response || null,
                confidence: rawAnalysis.emotion_score || rawAnalysis.confidence || 0
            },
            response: rawAnalysis.message || analysisData.response || null,
            alertGenerated: false,
            isActive: true
        });

        const savedAnalysis = await analysis.save();

        return {
            success: true,
            analysisId: savedAnalysis._id,
            analysis: {
                message: savedAnalysis.analysis.message || 'Mensaje no disponible',
                emotion: mapEmotionToEnglish(savedAnalysis.analysis.emotional_state),
                confidence: savedAnalysis.analysis.confidence,
                sentiment: savedAnalysis.analysis.sentiment_label,
                riskLevel: savedAnalysis.analysis.risk_level,
                keywords: savedAnalysis.analysis.keywords,
                trend: savedAnalysis.analysis.trend
            },
            timestamp: savedAnalysis.createdAt
        };

    } catch (error) {
        console.error('❌ Error en analyzeText:', error.message);
        console.error('Stack:', error.stack);
        throw new Error(`Error al analizar texto: ${error.message}`);
    }
};

export const checkANAHealth = async () => {
    try {
        const response = await axios.get(HEALTH_ENDPOINT, {
            timeout: 5000
        });

        if (response.status !== 200) {
            throw new Error('Servicio ANA no disponible');
        }

        return {
            success: true,
            status: response.data
        };
    } catch (error) {
        throw new Error(`Servicio ANA no disponible: ${error.message}`);
    }
};

function mapEmotionToSpanish(emotion) {
    const emotionMap = {
        joy: 'alegria',
        happiness: 'alegria',
        happy: 'alegria',
        sadness: 'tristeza',
        sad: 'tristeza',
        fear: 'miedo',
        anger: 'ira',
        angry: 'ira',
        disgust: 'disgust',
        surprise: 'sorpresa',
        stressed: 'estresado',
        stress: 'estresado',
        depressed: 'deprimido',
        depression: 'deprimido',
        anxious: 'ansioso',
        anxiety: 'ansioso',
        neutral: 'neutral'
    };

    return emotionMap[String(emotion).toLowerCase()] || 'neutral';
}

function mapEmotionToEnglish(emotion) {
    const emotionMap = {
        alegria: 'joy',
        tristeza: 'sadness',
        miedo: 'fear',
        ira: 'anger',
        disgust: 'disgust',
        sorpresa: 'surprise',
        estresado: 'stressed',
        deprimido: 'depressed',
        ansioso: 'anxious',
        neutral: 'neutral'
    };

    return emotionMap[String(emotion).toLowerCase()] || 'neutral';
}


function normalizeRiskToSpanish(risk) {
    if (!risk) return 'bajo';
    
    // Extraer solo la primera parte si viene como "bajo_tristeza_leve"
    const riskLevel = String(risk).toLowerCase().split('_')[0];
    
    const map = {
        low: 'bajo',
        medium: 'medio',
        high: 'alto',
        bajo: 'bajo',
        medio: 'medio',
        alto: 'alto'
    };

    return map[riskLevel] || 'bajo';
}

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
        throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
};