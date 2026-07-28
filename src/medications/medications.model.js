'use strict';

import mongoose from 'mongoose';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const medicationSchema = mongoose.Schema(
    {
        elderly: {
            type: String,
            required: [true, 'El adulto mayor es requerido'],
            index: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, 'El nombre del medicamento es requerido'],
            trim: true,
            maxLength: [150, 'El nombre no puede exceder 150 caracteres']
        },
        dose: {
            type: String,
            required: [true, 'La dosis es requerida'],
            trim: true,
            maxLength: [50, 'La dosis no puede exceder 50 caracteres']
        },
        times: {
            type: [String],
            required: [true, 'Se requiere al menos un horario'],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0 && arr.every((t) => TIME_PATTERN.test(t)),
                message: 'Los horarios deben tener formato HH:mm (ej. "08:00")'
            }
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

medicationSchema.index({ elderly: 1, isActive: 1 });

export default mongoose.model('Medication', medicationSchema);
