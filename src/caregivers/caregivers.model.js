'use strict';

import mongoose from 'mongoose';

const caregiverLinkSchema = mongoose.Schema(
    {
        elderly: {
            type: String,
            required: [true, 'El adulto mayor es requerido'],
            index: true,
            trim: true
        },
        caregiver: {
            type: String,
            required: [true, 'El cuidador es requerido'],
            index: true,
            trim: true
        },
        relationship: {
            type: String,
            required: [true, 'La relación es requerida'],
            enum: {
                values: ['HIJO', 'NIETO', 'FAMILIAR', 'PROFESIONAL'],
                message: 'Relación no válida'
            }
        },
        isPrimary: {
            type: Boolean,
            default: false
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

caregiverLinkSchema.index({ elderly: 1, caregiver: 1 }, { unique: true });
caregiverLinkSchema.index({ isActive: 1 });

export default mongoose.model('CaregiverLink', caregiverLinkSchema);