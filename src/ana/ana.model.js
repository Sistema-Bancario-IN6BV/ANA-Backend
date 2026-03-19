'use strict';

import mongoose from 'mongoose';

const analysisSchema = mongoose.Schema(
    {
        elderly: {
            type: String,
            required: [true, 'El id del adulto mayor es requerido'],
            index: true,
            trim: true
        },
        text: {
            type: String,
            required: [true, 'El texto analizado es requerido'],
            maxLength: [5000, 'El texto no puede exceder 5000 caracteres'],
            trim: true
        },
        analysis: {
            sentiment_label: {
                type: String,
                enum: ['positive', 'negative', 'neutral'],
                default: 'neutral'
            },
            emotion_model: {
                type: String,
                default: null
            },
            emotion_score: {
                type: Number,
                min: 0,
                max: 1,
                default: 0
            },
            emotional_state: {
                type: String,
                enum: ['alegria', 'tristeza', 'miedo', 'ira', 'disgust', 'estresado', 'deprimido', 'ansioso', 'neutral'],
                default: 'neutral'
            },
            semantic_state: {
                type: String,
                default: null
            },
            semantic_confidence: {
                type: Number,
                min: 0,
                max: 1,
                default: 0
            },
            context: {
                type: String,
                default: null
            },
            risk_level: {
                type: String,
                enum: ['bajo', 'medio', 'alto'],
                default: 'bajo'
            },
            keywords: {
                type: [String],
                default: []
            },
            trend: {
                type: String,
                enum: ['improving', 'declining', 'stable', 'unstable'],
                default: 'stable'
            },
            message: {
                type: String,
                default: null
            },
            confidence: {
                type: Number,
                min: 0,
                max: 1,
                default: 0
            }
        },
        response: {
            type: String,
            default: null
        },
        alertGenerated: {
            type: Boolean,
            default: false
        },
        alertId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Alert',
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Índices para optimizar consultas
analysisSchema.index({ elderly: 1, isActive: 1 });
analysisSchema.index({ createdAt: -1 });
analysisSchema.index({ 'analysis.emotional_state': 1 });
analysisSchema.index({ 'analysis.risk_level': 1 });

export default mongoose.model('Analysis', analysisSchema);
