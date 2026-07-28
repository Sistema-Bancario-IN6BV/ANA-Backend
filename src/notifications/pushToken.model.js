'use strict';

import mongoose from 'mongoose';

const pushTokenSchema = mongoose.Schema(
    {
        userId: {
            type: String,
            required: [true, 'El usuario es requerido'],
            unique: true,
            index: true,
            trim: true
        },
        token: {
            type: String,
            required: [true, 'El token de notificaciones es requerido'],
            trim: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model('PushToken', pushTokenSchema);
