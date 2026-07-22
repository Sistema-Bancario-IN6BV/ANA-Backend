'use strict';

import mongoose from 'mongoose';

const scanSchema = mongoose.Schema(
    {
        elderly: {
            type: String,
            required: [true, 'El id del adulto mayor es requerido'],
            index: true,
            trim: true
        },
        type: {
            type: String,
            required: [true, 'El tipo de escaneo es requerido'],
            enum: {
                values: ['vision', 'document'],
                message: 'Tipo de escaneo no válido'
            }
        },
        result: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, 'El resultado del escaneo es requerido']
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

scanSchema.index({ elderly: 1, type: 1, isActive: 1 });
scanSchema.index({ createdAt: -1 });

export default mongoose.model('Scan', scanSchema);
