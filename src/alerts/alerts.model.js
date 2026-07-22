'use strict';

import mongoose from 'mongoose';

const alertSchema = mongoose.Schema(
    {
        elderly: {
            type: String,
            required: [true, 'El adulto mayor es requerido'],
            index: true,
            trim: true
        },
        type: {
            type: String,
            required: [true, 'El tipo de alerta es requerido'],
            enum: {
                values: ['EMOCION_NEGATIVA', 'PRESION_ALTA', 'PRESION_BAJA', 'GLUCOSA_ALTA', 'GLUCOSA_BAJA', 'INACTIVIDAD', 'RIESGO_CAIDA', 'MEDICAMENTO_OMITIDO'],
                message: 'Tipo de alerta no válido'
            }
        },
        severity: {
            type: String,
            required: [true, 'La severidad es requerida'],
            enum: {
                values: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'],
                message: 'Severidad no válida'
            }
        },
        message: {
            type: String,
            required: [true, 'El mensaje es requerido'],
            maxLength: [500, 'El mensaje no puede exceder 500 caracteres']
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readBy: {
            type: String,
            default: null,
            trim: true
        },
        readAt: {
            type: Date,
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

alertSchema.index({ elderly: 1, isActive: 1 });
alertSchema.index({ isRead: 1 });
alertSchema.index({ type: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ createdAt: -1 });

export default mongoose.model('Alert', alertSchema);