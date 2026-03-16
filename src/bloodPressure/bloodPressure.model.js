'use strict';

import mongoose from 'mongoose';

const bloodPressureSchema = mongoose.Schema(
    {
        elderly: {
            type: String,
            required: [true, 'El adulto mayor es requerido'],
            index: true,
            trim: true
        },
        systolic: {
            type: Number,
            required: [true, 'La presión sistólica es requerida'],
            min: [0, 'No puede ser menor a 0'],
            max: [300, 'No puede exceder 300']
        },
        diastolic: {
            type: Number,
            required: [true, 'La presión diastólica es requerida'],
            min: [0, 'No puede ser menor a 0'],
            max: [200, 'No puede exceder 200']
        },
        pulse: {
            type: Number,
            min: [0, 'No puede ser menor a 0'],
            max: [300, 'No puede exceder 300'],
            default: null
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

bloodPressureSchema.index({ elderly: 1, isActive: 1 });
bloodPressureSchema.index({ measuredAt: -1 });
bloodPressureSchema.index({ recordedBy: 1 });

export default mongoose.model('BloodPressure', bloodPressureSchema);