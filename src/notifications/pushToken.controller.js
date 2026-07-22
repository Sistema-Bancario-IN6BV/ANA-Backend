'use strict';

import PushToken from './pushToken.model.js';

export const registerToken = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        await PushToken.findOneAndUpdate(
            { userId },
            { userId, token },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            message: 'Token de notificaciones registrado exitosamente'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al registrar el token de notificaciones',
            error: error.message
        });
    }
};
