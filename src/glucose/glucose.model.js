'use strict';

import mongoose from 'mongoose';

const glucoseSchema = mongoose.Schema(
    {
        elderly: {
            type: String,
            required: [true, 'El adulto mayor es requerido'],
            index: true,
            trim: true
        },
        glucoseLevel: {
            type: Number,
            required: [true, 'El nivel de glucosa es requerido'],
            min: [0, 'No puede ser menor a 0'],
            max: [1000, 'No puede exceder 1000']
        },
        measureType: {
            type: String,
            required: [true, 'El tipo de medición es requerido'],
            enum: {
                values: ['AYUNAS', 'POSTPRANDIAL', 'ALEATORIO'],
                message: 'Tipo de medición no válido'
            }
        },
        measuredAt: {
            type: Date,
            default: () => new Date()
        },
        recordedBy: {
            type: String,
            default: null,
            trim: true
        },
        notes: {
            type: String,
            maxLength: [300, 'Las notas no pueden exceder 300 caracteres'],
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

glucoseSchema.index({ elderly: 1, isActive: 1 });
glucoseSchema.index({ measuredAt: -1 });
glucoseSchema.index({ recordedBy: 1 });
glucoseSchema.index({ measureType: 1 });

export default mongoose.model('Glucose', glucoseSchema);