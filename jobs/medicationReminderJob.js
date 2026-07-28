'use strict';

import Medication from '../src/medications/medications.model.js';
import MedicationLog from '../src/medications/medicationLog.model.js';
import Alert from '../src/alerts/alerts.model.js';
import { generateMissedDoseAlert } from '../src/alerts/alerts.service.js';
import {
    minutesSinceScheduledToday,
    scheduledDateToday,
    isWithinMissedDoseWindow,
    MATCH_WINDOW_HOURS
} from '../helpers/medication-schedule.js';

const HOUR_MS = 60 * 60 * 1000;

// Revisa todos los medicamentos activos y genera una alerta de "dosis omitida"
// para cada horario que ya pasó el período de gracia sin una toma registrada
// cerca de esa hora, evitando duplicar la alerta si ya se envió una.
export const checkMissedDoses = async () => {
    const now = new Date();
    const medications = await Medication.find({ isActive: true });

    for (const medication of medications) {
        for (const time of medication.times) {
            const minutesSince = minutesSinceScheduledToday(time, now);
            if (!isWithinMissedDoseWindow(minutesSince)) continue;

            const scheduled = scheduledDateToday(time, now);
            const windowStart = new Date(scheduled.getTime() - MATCH_WINDOW_HOURS * HOUR_MS);
            const windowEnd = new Date(scheduled.getTime() + MATCH_WINDOW_HOURS * HOUR_MS);

            const taken = await MedicationLog.findOne({
                medication: medication._id,
                createdAt: { $gte: windowStart, $lte: windowEnd }
            });
            if (taken) continue;

            const alreadyAlerted = await Alert.findOne({
                elderly: medication.elderly,
                type: 'MEDICAMENTO_OMITIDO',
                message: { $regex: `^${medication.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(${medication.dose.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\).*${time}` },
                createdAt: { $gte: windowStart }
            });
            if (alreadyAlerted) continue;

            await generateMissedDoseAlert(medication.elderly, medication.name, medication.dose, time);
        }
    }
};

// Corre checkMissedDoses cada `intervalMinutes` minutos. Devuelve el handle
// del interval por si el caller necesita detenerlo (tests, shutdown, etc).
export const startMedicationReminderJob = (intervalMinutes = 15) => {
    const run = () => checkMissedDoses().catch((err) => console.error('Error revisando dosis omitidas:', err.message));
    run();
    return setInterval(run, intervalMinutes * 60 * 1000);
};
