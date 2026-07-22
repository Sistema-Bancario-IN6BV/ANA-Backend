'use strict';

// Cuánto esperar después de la hora programada antes de considerar la dosis "omitida".
export const GRACE_MINUTES = 45;
// Después de cuánto tiempo dejamos de alertar por una dosis vieja (evita
// avalanchas de alertas si el servidor estuvo caído varias horas).
export const MAX_ALERT_WINDOW_MINUTES = GRACE_MINUTES + 6 * 60;
// Ventana alrededor de la hora programada donde una toma registrada cuenta
// como "de esa dosis" (no exactamente esa hora, pero razonablemente cerca).
export const MATCH_WINDOW_HOURS = 3;

/**
 * Minutos transcurridos desde que ocurrió `time` (HH:mm) *hoy*, relativo a `now`.
 * Negativo si esa hora todavía no llega hoy.
 */
export const minutesSinceScheduledToday = (time, now = new Date()) => {
    const [hour, minute] = time.split(':').map(Number);
    const scheduled = new Date(now);
    scheduled.setHours(hour, minute, 0, 0);
    return (now.getTime() - scheduled.getTime()) / 60000;
};

/**
 * Fecha (hoy) correspondiente a un horario HH:mm.
 */
export const scheduledDateToday = (time, now = new Date()) => {
    const [hour, minute] = time.split(':').map(Number);
    const scheduled = new Date(now);
    scheduled.setHours(hour, minute, 0, 0);
    return scheduled;
};

/**
 * true si una dosis programada hace `minutesSince` minutos ya debería
 * considerarse omitida (pasó el período de gracia) pero no tan vieja
 * como para ya no valer la pena alertar.
 */
export const isWithinMissedDoseWindow = (minutesSince) =>
    minutesSince >= GRACE_MINUTES && minutesSince <= MAX_ALERT_WINDOW_MINUTES;
