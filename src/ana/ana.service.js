'use strict';

import axios from 'axios';
import Analysis from './ana.model.js';
import Scan from './scan.model.js';
import { findUserById } from '../../helpers/user-db.js';

const ANA_API_URL      = process.env.ANA_API_URL || 'http://localhost:8000';
const CHAT_ENDPOINT    = `${ANA_API_URL}/chat`;
const HEALTH_ENDPOINT  = `${ANA_API_URL}/health`;

// ──────────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────────
export const checkANAHealth = async () => {
    const response = await axios.get(HEALTH_ENDPOINT, { timeout: 5000 });
    if (response.status !== 200) throw new Error('Servicio ANA no disponible');
    return { success: true, status: response.data };
};

// ──────────────────────────────────────────────
// ANÁLISIS PRINCIPAL
// ──────────────────────────────────────────────
export const analyzeText = async (text, elderlyId) => {
    try {
        await checkANAHealth();

        // Obtener perfil del abuelo desde PostgreSQL
        let profile = {};
        try {
            const user = await findUserById(elderlyId);
            console.log(`🔍 Usuario encontrado: ${JSON.stringify({id: user?.id, name: user?.Name, surname: user?.Surname})}`);
            
            if (user && user.Name) {
                const birthDate = user.UserProfile?.BirthDate;
                const age = birthDate
                    ? Math.floor((Date.now() - new Date(birthDate)) / 3.154e10)
                    : null;

                profile = {
                    name:        `${user.Name} ${user.Surname || ''}`.trim(),
                    age,
                    preferences: [],
                    symptoms:    [],
                    hobbies:     [],
                    family:      [],
                };
                console.log(`✅ Perfil construido: name="${profile.name}", age=${age}`);
            } else {
                console.warn('⚠️ Usuario no válido o sin Name:', user);
            }
        } catch (profileError) {
            console.warn('⚠️ No se pudo obtener perfil del abuelo:', profileError.message);
        }

        console.log(`📤 Enviando a ANA: "${text}" | Usuario: ${profile.name || `[SIN NOMBRE - ID: ${elderlyId}]`}`);

        // Llamar a ANA v4 — endpoint /chat con perfil incluido
        const { data } = await axios.post(
            CHAT_ENDPOINT,
            {
                text,
                elderly_id:  elderlyId?.toString(),
                // Perfil desde PostgreSQL
                name:        profile.name        || null, // Fallback si no hay nombre
                age:         profile.age         || null,
                preferences: profile.preferences || [],
                symptoms:    profile.symptoms    || [],
                hobbies:     profile.hobbies     || [],
                family:      profile.family      || [],
            },
            { timeout: 60000, headers: { 'Content-Type': 'application/json' } }
        );

        console.log('✅ Respuesta de ANA recibida:', JSON.stringify(data, null, 2));

        // ── Mapear respuesta ANA v4 ──────────────────
        // data.analysis = { emotion, risk_level, keywords, context, summary, language }
        // data.response = string empático
        // data.suggestions = actividades
        // data.trend = tendencia
        // data.alert = estado alerta

        const rawAnalysis = data.analysis || {};
        // Python devuelve "emotional_state"; "emotion" es alias de compatibilidad
        const rawEmotion  = rawAnalysis.emotional_state || rawAnalysis.emotion || 'neutral';
        const riskLevel   = normalizeRisk(rawAnalysis.risk_level || 'bajo');
        const emotionEs   = mapEmotionToSpanish(rawEmotion);
        // data.response es siempre string desde la IA-Engine
        const responseText = typeof data.response === 'string'
            ? data.response
            : data.response?.message || null;

        const analysis = new Analysis({
            elderly: elderlyId,
            text,
            analysis: {
                sentiment_label:     rawAnalysis.sentiment_label || 'neutral',
                emotion_model:       rawEmotion,
                emotion_score:       rawAnalysis.emotion_score   || 0,
                emotional_state:     emotionEs,
                semantic_state:      rawAnalysis.semantic_state  || rawAnalysis.context || null,
                semantic_confidence: rawAnalysis.semantic_confidence || 0,
                context:             rawAnalysis.context          || null,
                risk_level:          riskLevel,
                keywords:            rawAnalysis.keywords         || [],
                trend:               data.trend                   || 'stable',
                message:             responseText,
                confidence:          rawAnalysis.emotion_score    || 0,
            },
            response:       responseText,
            alertGenerated: data.alert?.sent || false,
            isActive:       true,
        });

        const saved = await analysis.save();
        console.log('💾 Análisis guardado:', saved._id);

        return {
            success:     true,
            analysisId:  saved._id,
            analysis: {
                message:     saved.analysis.message   || 'Mensaje no disponible',
                emotion:     mapEmotionToEnglish(saved.analysis.emotional_state),
                confidence:  saved.analysis.confidence,
                sentiment:   saved.analysis.sentiment_label,
                riskLevel:   saved.analysis.risk_level,
                keywords:    saved.analysis.keywords,
                trend:       saved.analysis.trend,
            },
            suggestions: data.suggestions || [],
            timestamp:   saved.createdAt,
        };

    } catch (error) {
        console.error('❌ ERROR en analyzeText:', error.message);
        console.error('Status Axios:', error.response?.status);
        console.error('Data Axios:',  error.response?.data);
        throw new Error(`Error al analizar texto: ${error.message}`);
    }
};

// ──────────────────────────────────────────────
// HISTORIAL
// ──────────────────────────────────────────────
export const getHistoryFromAPI = async (elderlyId, limit = 20, skip = 0) => {
    const analyses = await Analysis.find(
        { elderly: elderlyId, isActive: true },
        { text: 1, 'analysis.emotional_state': 1, 'analysis.confidence': 1,
          'analysis.risk_level': 1, 'analysis.trend': 1, createdAt: 1 }
    ).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();

    const total = await Analysis.countDocuments({ elderly: elderlyId, isActive: true });

    return {
        success: true,
        data:    analyses,
        pagination: { total, limit, skip, hasMore: skip + limit < total },
    };
};

// ──────────────────────────────────────────────
// ESCANEOS (visión / documentos)
// ──────────────────────────────────────────────
export const saveScan = async (elderlyId, type, result) => {
    const scan = new Scan({ elderly: elderlyId, type, result });
    return scan.save();
};

export const getScanHistory = async (elderlyId, type, limit = 20, skip = 0) => {
    const filter = { elderly: elderlyId, isActive: true };
    if (type) filter.type = type;

    const scans = await Scan.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
    const total = await Scan.countDocuments(filter);

    return {
        success: true,
        data:    scans,
        pagination: { total, limit, skip, hasMore: skip + limit < total },
    };
};

// ──────────────────────────────────────────────
// POR ID
// ──────────────────────────────────────────────
export const getAnalysisByIdFromAPI = async (analysisId) => {
    const analysis = await Analysis.findById(analysisId);
    if (!analysis) throw new Error('Análisis no encontrado');
    return { success: true, data: analysis };
};

// ──────────────────────────────────────────────
// ELIMINAR (soft delete)
// ──────────────────────────────────────────────
export const deleteAnalysisFromAPI = async (analysisId) => {
    const analysis = await Analysis.findByIdAndUpdate(
        analysisId, { isActive: false }, { new: true }
    );
    if (!analysis) throw new Error('Análisis no encontrado');
    return { success: true, message: 'Análisis eliminado correctamente' };
};

// ──────────────────────────────────────────────
// ESTADÍSTICAS
// ──────────────────────────────────────────────
export const getEmotionStats = async (elderlyId) => {
    const stats = await Analysis.aggregate([
        { $match: { elderly: elderlyId, isActive: true } },
        { $group: { _id: '$analysis.emotional_state', count: { $sum: 1 },
                    avgConfidence: { $avg: '$analysis.confidence' } } },
        { $sort: { count: -1 } },
    ]);
    const total = await Analysis.countDocuments({ elderly: elderlyId, isActive: true });
    return { success: true, data: stats, total };
};

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function mapEmotionToSpanish(emotion) {
    const map = {
        joy: 'alegria', happiness: 'alegria', happy: 'alegria', alegria: 'alegria',
        sadness: 'tristeza', sad: 'tristeza', tristeza: 'tristeza',
        fear: 'miedo', miedo: 'miedo',
        anger: 'ira', angry: 'ira', enojo: 'ira',
        disgust: 'disgust',
        surprise: 'sorpresa',
        stressed: 'estresado', stress: 'estresado',
        depressed: 'deprimido', depression: 'deprimido',
        anxious: 'ansioso', anxiety: 'ansioso', ansiedad: 'ansioso',
        soledad: 'soledad', loneliness: 'soledad',
        confused: 'confuso', confusion: 'confuso',
        nostalgia: 'neutral',
        neutral: 'neutral',
    };
    return map[String(emotion).toLowerCase()] || 'neutral';
}

function mapEmotionToEnglish(emotion) {
    const map = {
        alegria: 'joy', tristeza: 'sadness', miedo: 'fear', ira: 'anger',
        disgust: 'disgust', sorpresa: 'surprise', estresado: 'stressed',
        deprimido: 'depressed', ansioso: 'anxious', soledad: 'sadness',
        confuso: 'confused', neutral: 'neutral',
    };
    return map[String(emotion).toLowerCase()] || 'neutral';
}

function normalizeRisk(risk) {
    const level = String(risk).toLowerCase().split('_')[0];
    const map   = {
        low: 'bajo', medium: 'medio', high: 'alto', critical: 'critico',
        bajo: 'bajo', medio: 'medio', alto: 'alto', critico: 'critico',
    };
    return map[level] || 'bajo';
}
