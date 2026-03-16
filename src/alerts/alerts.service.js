'use strict';

/**
 * Servicio de alertas
 * Crea y gestiona alertas basadas en datos de salud
 */

/**
 * Crear alerta
 */
export const createAlert = async (alertData) => {
    try {
        const newAlert = {
            id: `alert_${Date.now()}`,
            ...alertData,
            isViewed: false,
            isResolved: false,
            createdAt: new Date()
        };

        // await newAlert.save();

        return newAlert;
    } catch (error) {
        throw new Error(`Error al crear alerta: ${error.message}`);
    }
};

/**
 * Generar alertas basadas en niveles de glucosa
 */
export const generateGlucoseAlert = async (patientId, glucoseLevel, glucoseData) => {
    let alert = null;

    if (glucoseLevel > 180) {
        alert = await createAlert({
        patientId,
        alertType: 'high_glucose',
        severity: glucoseLevel > 250 ? 'critical' : 'high',
        title: `Nivel de glucosa elevado: ${glucoseLevel} mg/dL`,
        message: glucoseLevel > 250 
            ? 'CRÍTICO: Nivel de glucosa muy elevado. Contacte médico inmediatamente.'
            : 'Nivel de glucosa elevado. Monitoree regularmente.',
        healthData: glucoseData
        });
    } else if (glucoseLevel < 70) {
        alert = await createAlert({
            patientId,
            alertType: 'low_glucose',
            severity: glucoseLevel < 50 ? 'critical' : 'high',
            title: `Nivel de glucosa bajo: ${glucoseLevel} mg/dL`,
            message: glucoseLevel < 50
            ? 'CRÍTICO: Glucosa muy baja. Consuma alimento azucarado ahora.'
            : 'Glucosa baja. Coma algo dulce.',
            healthData: glucoseData
        });
    }
    return alert;
};

/**
 * Generar alertas basadas en presión arterial
 */
export const generateBloodPressureAlert = async (patientId, systolic, diastolic, bpData) => {
    let alert = null;

    if (systolic > 140 || diastolic > 90) {
        const severity = (systolic > 180 || diastolic > 120) ? 'critical' : 'high';
    
        alert = await createAlert({
            patientId,
            alertType: 'high_blood_pressure',
            severity,
            title: `Presión arterial elevada: ${systolic}/${diastolic}`,
            message: severity === 'critical'
            ? `CRÍTICO: ${systolic}/${diastolic} mmHg. Busque atención médica de emergencia.`
            : `Presión elevada: ${systolic}/${diastolic} mmHg. Monitoree.`,
            healthData: bpData
        });
    }
    return alert;
};

/**
 * Generar alertas por emociones negativas
 */
export const generateEmotionAlert = async (patientId, emotion, emotionScore, emotionData) => {
    // Emociones negativas y su severidad
    const negativeEmotions = {
        'sad': { severity: 'medium', message: 'Emoción detectada: tristeza' },
        'angry': { severity: 'high', message: 'Emoción detectada: ira' },
        'anxious': { severity: 'high', message: 'Emoción detectada: ansiedad' },
        'depressed': { severity: 'critical', message: 'Emoción detectada: depresión' },
        'stressed': { severity: 'medium', message: 'Emoción detectada: estrés' }
    };

    if (negativeEmotions[emotion]) {
        const { severity, message } = negativeEmotions[emotion];

        const alert = await createAlert({
        patientId,
        alertType: 'negative_emotion',
        severity,
        title: `Emoción negativa detectada: ${emotion} (${(emotionScore * 100).toFixed(0)}%)`,
        message: `${message}. Monitoree el bienestar emocional del paciente.`,
        healthData: emotionData
        });
        return alert;
    }
    return null;
};

/**
 * Obtener alertas de un paciente
 */
export const getPatientAlerts = async (patientId, filters = {}) => {
    try {
        // const alerts = await Alert.find({ patientId })
        //   .sort({ createdAt: -1 })
        //   .limit(filters.limit || 50);

    return [
        {
            id: 'alert_1',
            patientId,
            alertType: 'high_glucose',
            severity: 'high',
            title: 'Nivel de glucosa elevado: 220 mg/dL',
            message: 'Nivel de glucosa elevado. Monitoree regularmente.',
            isViewed: false,
            isResolved: false,
            createdAt: new Date()
        },
        {
            id: 'alert_2',
            patientId,
            alertType: 'high_blood_pressure',
            severity: 'high',
            title: 'Presión arterial elevada: 145/92',
            message: 'Presión elevada: 145/92 mmHg. Monitoree.',
            isViewed: true,
            isResolved: true,
            createdAt: new Date()
        }
    ];
    } catch (error) {
        throw new Error(`Error al obtener alertas: ${error.message}`);
    }
};

/**
 * Obtener alertas activas (no resueltas) de un paciente
 */
export const getActiveAlerts = async (patientId) => {
    try {
        // const alerts = await Alert.find({ 
        //   patientId, 
        //   isResolved: false 
        // }).sort({ createdAt: -1 });

        return [];
    } catch (error) {
        throw new Error(`Error al obtener alertas activas: ${error.message}`);
    }
};

/**
 * Marcar alerta como vista
 */
export const markAlertAsViewed = async (alertId, patientId) => {
    try {
        // const alert = await Alert.findByIdAndUpdate(
        //   alertId,
        //   { isViewed: true, viewedAt: new Date() },
        //   { new: true }
        // );

        return { id: alertId, isViewed: true, viewedAt: new Date() };
    } catch (error) {
        throw new Error(`Error al marcar como visto: ${error.message}`);
    }
};

/**
 * Resolver alerta
 */
export const resolveAlert = async (alertId, patientId) => {
    try {
        // const alert = await Alert.findByIdAndUpdate(
        //   alertId,
        //   { isResolved: true, resolvedAt: new Date() },
        //   { new: true }
        // );

        return { id: alertId, isResolved: true, resolvedAt: new Date() };
    } catch (error) {
        throw new Error(`Error al resolver alerta: ${error.message}`);
    }
};
