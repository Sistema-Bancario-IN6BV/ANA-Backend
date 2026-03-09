'use strict';

import mongoose from 'mongoose';

const alertSchema = mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'El ID del paciente es requerido'],
            ref: 'User'
        },
        alertType: {
            type: String,
            enum: {
                values: ['high_glucose', 'low_glucose', 'high_blood_pressure', 'negative_emotion', 'system'],
                message: 'Tipo de alerta no válido'
            },
            required: [true, 'El tipo de alerta es requerido']
        },
        severity: {
            type: String,
            enum: {
            values: ['low', 'medium', 'high', 'critical'],
            message: 'Severidad no válida'
            },
            default: 'medium'
        },
        title: {
            type: String,
            required: [true, 'El título es requerido'],
            trim: true,
            maxLength: [100, 'El título no puede exceder 100 caracteres']
        },
        message: {
            type: String,
            required: [true, 'El mensaje es requerido'],
            trim: true,
            maxLength: [500, 'El mensaje no puede exceder 500 caracteres']
        },
        healthData: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        isViewed: {
            type: Boolean,
            default: false
        },
        viewedAt: {
            type: Date,
            default: null
        },
        isResolved: {
            type: Boolean,
            default: false
        },
        resolvedAt: {
            type: Date,
            default: null
        }   
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Índices
alertSchema.index({ patientId: 1 });
alertSchema.index({ alertType: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ isViewed: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ patientId: 1, isViewed: 1 });

export default mongoose.model('Alert', alertSchema);
