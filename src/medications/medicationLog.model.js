'use strict';

import mongoose from 'mongoose';

const medicationLogSchema = mongoose.Schema(
    {
        elderly: {
            type: String,
            required: [true, 'El adulto mayor es requerido'],
            index: true,
            trim: true
        },
        medication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medication',
            required: [true, 'El medicamento es requerido'],
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

medicationLogSchema.index({ medication: 1, createdAt: -1 });

export default mongoose.model('MedicationLog', medicationLogSchema);
