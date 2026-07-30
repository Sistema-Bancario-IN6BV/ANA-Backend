import { config } from '../configs/config.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

const createResendClient = () => {
  if (!config.resend.apiKey) {
    console.warn(
      'Resend API key not configured. Email functionality will not work.'
    );
    return null;
  }

  return {
    sendEmail: async (payload) => {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.resend.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend request failed: ${response.status} ${errorText}`);
      }

      return response.json();
    },
  };
};

const resendClient = createResendClient();

const getFromAddress = () => {
  const fromEmail = config.resend.fromEmail || config.smtp.fromEmail || 'no-reply@marlonperez.me';
  const fromName = config.resend.fromName || config.smtp.fromName || 'ANA';
  return `${fromName} <${fromEmail}>`;
};

const sendEmail = async (to, subject, html) => {
  if (!resendClient) {
    throw new Error('Resend client not configured');
  }

  return resendClient.sendEmail({
    from: getFromAddress(),
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
};

export const sendVerificationEmail = async (email, name, verificationToken) => {
  try {
    const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const html = `
      <h2>Welcome ${name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href='${verificationUrl}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
          Verify Email
      </a>
      <p>If you cannot click the link, copy and paste this URL into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `;

    await sendEmail(email, 'Verify your email address', html);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href='${resetUrl}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
          Reset Password
      </a>
      <p>If you cannot click the link, copy and paste this URL into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    `;

    await sendEmail(email, 'Reset your password', html);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const html = `
      <h2>Welcome to AuthDotnet, ${name}!</h2>
      <p>Your account has been successfully verified and activated.</p>
      <p>You can now enjoy all the features of our platform.</p>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Thank you for joining us!</p>
    `;

    await sendEmail(email, 'Welcome to AuthDotnet!', html);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const sendPasswordChangedEmail = async (email, name) => {
  try {
    const html = `
      <h2>Password Changed</h2>
      <p>Hello ${name},</p>
      <p>Your password has been successfully updated.</p>
      <p>If you didn't make this change, please contact our support team immediately.</p>
      <p>This is an automated email, please do not reply to this message.</p>
    `;

    await sendEmail(email, 'Password Changed Successfully', html);
  } catch (error) {
    console.error('Error sending password changed email:', error);
    throw error;
  }
};

/**
 * Enviar alerta al cuidador
 */
export const sendAlertEmail = async (email, caregiverName, alertType, severity, message) => {
  try {
    // Mapear severidad a color y descripción
    const severityColors = {
      BAJA: '#ffc107',
      MEDIA: '#fd7e14',
      ALTA: '#dc3545',
      CRITICA: '#6f0f00',
    };

    const severityLabels = {
      BAJA: 'Baja',
      MEDIA: 'Media',
      ALTA: 'Alta',
      CRITICA: 'Crítica',
    };

    const alertTypeLabels = {
      EMOCION_NEGATIVA: 'Emoción Negativa',
      PRESION_ALTA: 'Presión Arterial Alta',
      PRESION_BAJA: 'Presión Arterial Baja',
      GLUCOSA_ALTA: 'Glucosa Alta',
      GLUCOSA_BAJA: 'Glucosa Baja',
      INACTIVIDAD: 'Inactividad Prolongada',
    };

    const color = severityColors[severity] || '#6c757d';
    const severityLabel = severityLabels[severity] || severity;
    const typeLabel = alertTypeLabels[alertType] || alertType;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center; margin: 20px 0;">⚠️ Alerta de Salud</h2>
        
        <div style="background-color: ${color}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px;">${typeLabel}</h3>
          <p style="margin: 0; font-size: 14px;">Severidad: <strong>${severityLabel}</strong></p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid ${color};">
          <h4 style="margin-top: 0; color: #333;">Detalles de la Alerta:</h4>
          <p style="margin: 8px 0;"><strong>Tipo:</strong> ${typeLabel}</p>
          <p style="margin: 8px 0;"><strong>Mensaje:</strong> ${message}</p>
          <p style="margin: 8px 0;"><strong>Hora:</strong> ${new Date().toLocaleString('es-AR')}</p>
          <p style="margin: 8px 0;"><strong>Severidad:</strong> ${severityLabel}</p>
        </div>
        
        <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; color: #333; line-height: 1.6;">
            Hola <strong>${caregiverName}</strong>,<br><br>
            Se ha generado una alerta de <strong>${typeLabel.toLowerCase()}</strong> para uno de los adultos mayores asignados a tu cuidado.<br>
            Por favor, verifica el estado del paciente y toma las acciones necesarias.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            Este es un correo automático del Sistema de Monitoreo de Salud para Adultos Mayores (ANA).<br>
            Por favor, no responda a este correo.
          </p>
        </div>
      </div>
    `;

    await sendEmail(email, `🚨 Alerta: ${typeLabel} - Severidad ${severityLabel}`, html);
  } catch (error) {
    console.error('Error sending alert email:', error);
    throw error;
  }
};
