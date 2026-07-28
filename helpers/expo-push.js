'use strict';

import axios from 'axios';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Envía una notificación push a través del servicio de Expo. No lanza si
// falla — el email sigue siendo el canal principal, el push es un extra.
export const sendExpoPush = async (token, title, body) => {
    if (!token) return null;

    try {
        const { data } = await axios.post(
            EXPO_PUSH_URL,
            {
                to: token,
                title,
                body,
                sound: 'default',
                priority: 'high',
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            }
        );
        return data;
    } catch (error) {
        console.error('Error enviando push notification:', error.message);
        return null;
    }
};
