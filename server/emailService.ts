import { ENV } from "./_core/env";
import { createLogger } from "./_core/logger";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

export type EmailTemplateName =
  | "metrics_reminder_day1"
  | "metrics_reminder_day3"
  | "metrics_reminder_day6"
  | "metrics_reminder_day11"
  | "badge_unlocked"
  | "instagram_reconnect";

export interface MetricsReminderData {
  firstName: string;
  mes: number;
  ano: number;
  streakCount?: number;
}

export interface BadgeUnlockedData {
  firstName: string;
  badgeNome: string;
  badgeDescricao: string;
  badgeIcone: string;
  badgePontos: number;
}

export interface InstagramReconnectData {
  firstName: string;
}

type TemplateData = MetricsReminderData | BadgeUnlockedData | InstagramReconnectData;

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const NEON_BRAND_COLORS = {
  primary: "#6366f1", // Indigo-500
  primaryDark: "#4f46e5", // Indigo-600
  gold: "#f59e0b", // Amber-500
  background: "#1e1b4b", // Indigo-950
  white: "#ffffff",
  gray: "#9ca3af",
  darkBg: "#0f0d1a",
};

/**
 * Base email wrapper with Neon branding
 */
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Dashboard</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${NEON_BRAND_COLORS.darkBg};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${NEON_BRAND_COLORS.darkBg};">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, ${NEON_BRAND_COLORS.background} 0%, ${NEON_BRAND_COLORS.darkBg} 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(99, 102, 241, 0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid rgba(99, 102, 241, 0.2);">
              <h1 style="margin: 0; color: ${NEON_BRAND_COLORS.white}; font-size: 28px; font-weight: 700;">
                <span style="color: ${NEON_BRAND_COLORS.primary};">NEON</span> Dashboard
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; border-top: 1px solid rgba(99, 102, 241, 0.2);">
              <p style="margin: 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 12px;">
                © ${new Date().getFullYear()} Neon Dashboard - Mentoria Black
              </p>
              <p style="margin: 8px 0 0 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 11px;">
                Este email foi enviado automaticamente. Não responda a esta mensagem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * CTA Button component
 */
function ctaButton(text: string, url = "#"): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
      <tr>
        <td style="border-radius: 8px; background: linear-gradient(135deg, ${NEON_BRAND_COLORS.primary} 0%, ${NEON_BRAND_COLORS.primaryDark} 100%);">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 32px; color: ${NEON_BRAND_COLORS.white}; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function metricsReminderDay1(data: MetricsReminderData): string {
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const monthName = monthNames[data.mes - 1];

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.white}; font-size: 24px;">
      🎯 Olá, ${data.firstName}!
    </h2>
    <p style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Começou um novo mês! É hora de registrar suas métricas de <strong style="color: ${NEON_BRAND_COLORS.white};">${monthName}/${data.ano}</strong> no Dashboard Neon.
    </p>
    <p style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Registre seu faturamento, leads, procedimentos e conteúdos para acompanhar sua evolução e conquistar novas badges!
    </p>
    ${ctaButton("Registrar Métricas")}
    <p style="margin: 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 14px; text-align: center;">
      Lembre-se: registrar até o dia 10 mantém seu streak ativo! 🔥
    </p>
  `;

  return emailWrapper(content);
}

function metricsReminderDay3(data: MetricsReminderData): string {
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const monthName = monthNames[data.mes - 1];

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.white}; font-size: 24px;">
      🔔 Lembrete amigável, ${data.firstName}!
    </h2>
    <p style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Ainda não registrou suas métricas de <strong style="color: ${NEON_BRAND_COLORS.white};">${monthName}/${data.ano}</strong>?
    </p>
    <div style="background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; color: ${NEON_BRAND_COLORS.white}; font-size: 14px;">
        💡 <strong>Dica:</strong> Registrar cedo te ajuda a conquistar a badge "Pontualidade" - para quem envia até o dia 5!
      </p>
    </div>
    ${ctaButton("Registrar Agora")}
    <p style="margin: 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 14px; text-align: center;">
      Prazo final: dia 10 para manter o streak.
    </p>
  `;

  return emailWrapper(content);
}

function metricsReminderDay6(data: MetricsReminderData): string {
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const monthName = monthNames[data.mes - 1];

  const streakMessage =
    data.streakCount && data.streakCount > 0
      ? `<p style="margin: 0; color: ${NEON_BRAND_COLORS.gold}; font-size: 18px; font-weight: 600;">🔥 Seu streak atual: ${data.streakCount} meses</p>`
      : "";

  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gold}; font-size: 24px;">
      ⚠️ Atenção, ${data.firstName}!
    </h2>
    <p style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 16px; line-height: 1.6;">
      O prazo para registrar suas métricas de <strong style="color: ${NEON_BRAND_COLORS.white};">${monthName}/${data.ano}</strong> está chegando!
    </p>
    <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(245, 158, 11, 0.3);">
      ${streakMessage}
      <p style="margin: ${data.streakCount ? "10px 0 0 0" : "0"}; color: ${NEON_BRAND_COLORS.white}; font-size: 14px;">
        Registre hoje para manter seu streak e garantir seus pontos no ranking!
      </p>
    </div>
    ${ctaButton("Registrar Métricas")}
    <p style="margin: 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 14px; text-align: center;">
      ⏰ Restam apenas alguns dias!
    </p>
  `;

  return emailWrapper(content);
}

function metricsReminderDay11(data: MetricsReminderData): string {
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const monthName = monthNames[data.mes - 1];

  const streakMessage =
    data.streakCount && data.streakCount > 0
      ? `<p style="margin: 10px 0 0 0; color: ${NEON_BRAND_COLORS.white}; font-size: 16px;">Seu streak de <strong>${data.streakCount} meses</strong> será perdido se não registrar hoje!</p>`
      : "";

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #ef4444; font-size: 24px;">
      🔴 ÚLTIMO DIA, ${data.firstName}!
    </h2>
    <div style="background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 24px; margin: 0 0 20px 0; border: 1px solid rgba(239, 68, 68, 0.3);">
      <p style="margin: 0; color: ${NEON_BRAND_COLORS.white}; font-size: 16px; line-height: 1.6;">
        Hoje é o <strong>último dia</strong> para registrar suas métricas de <strong>${monthName}/${data.ano}</strong>!
      </p>
      ${streakMessage}
    </div>
    <p style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Não perca a oportunidade de acompanhar sua evolução e manter sua posição no ranking.
    </p>
    ${ctaButton("Registrar Agora")}
    <p style="margin: 0; color: #ef4444; font-size: 14px; text-align: center; font-weight: 600;">
      ⚡ Registre agora antes que seja tarde!
    </p>
  `;

  return emailWrapper(content);
}

function badgeUnlockedTemplate(data: BadgeUnlockedData): string {
  const content = `
    <div style="text-align: center;">
      <div style="font-size: 72px; margin-bottom: 20px;">
        ${data.badgeIcone}
      </div>
      <h2 style="margin: 0 0 10px 0; color: ${NEON_BRAND_COLORS.gold}; font-size: 28px;">
        🎉 Parabéns, ${data.firstName}!
      </h2>
      <p style="margin: 0 0 30px 0; color: ${NEON_BRAND_COLORS.white}; font-size: 18px;">
        Você conquistou uma nova badge!
      </p>
    </div>
    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%); border-radius: 16px; padding: 30px; margin: 0 0 30px 0; border: 1px solid rgba(245, 158, 11, 0.3); text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: ${NEON_BRAND_COLORS.white}; font-size: 24px;">
        ${data.badgeNome}
      </h3>
      <p style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 16px;">
        ${data.badgeDescricao}
      </p>
      <div style="display: inline-block; background: ${NEON_BRAND_COLORS.primary}; border-radius: 20px; padding: 8px 20px;">
        <span style="color: ${NEON_BRAND_COLORS.white}; font-size: 14px; font-weight: 600;">
          +${data.badgePontos} pontos
        </span>
      </div>
    </div>
    ${ctaButton("Ver Minhas Badges")}
    <p style="margin: 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 14px; text-align: center;">
      Continue evoluindo para conquistar mais badges! 🚀
    </p>
  `;

  return emailWrapper(content);
}

function instagramReconnectTemplate(data: InstagramReconnectData): string {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.white}; font-size: 24px;">
      🔗 Olá, ${data.firstName}!
    </h2>
    <p style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Seu token de acesso ao Instagram expirou. Para continuar sincronizando suas métricas automaticamente, você precisa reconectar sua conta.
    </p>
    <div style="background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; color: ${NEON_BRAND_COLORS.white}; font-size: 14px; line-height: 1.6;">
        🔒 <strong>Fique tranquilo:</strong> Seus dados anteriores estão seguros. Você só precisa autorizar novamente o acesso para continuar a sincronização automática de posts e stories.
      </p>
    </div>
    ${ctaButton("Reconectar Instagram")}
    <p style="margin: 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 14px; text-align: center;">
      A sincronização automática economiza seu tempo e mantém suas métricas sempre atualizadas!
    </p>
  `;

  return emailWrapper(content);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE GETTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get HTML email template by name
 *
 * @param templateName - Name of the template
 * @param data - Data to populate the template
 * @returns HTML string for the email body
 */
export function getEmailTemplate(templateName: EmailTemplateName, data: TemplateData): string {
  switch (templateName) {
    case "metrics_reminder_day1":
      return metricsReminderDay1(data as MetricsReminderData);
    case "metrics_reminder_day3":
      return metricsReminderDay3(data as MetricsReminderData);
    case "metrics_reminder_day6":
      return metricsReminderDay6(data as MetricsReminderData);
    case "metrics_reminder_day11":
      return metricsReminderDay11(data as MetricsReminderData);
    case "badge_unlocked":
      return badgeUnlockedTemplate(data as BadgeUnlockedData);
    case "instagram_reconnect":
      return instagramReconnectTemplate(data as InstagramReconnectData);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL SENDING
// ═══════════════════════════════════════════════════════════════════════════

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

/**
 * Sends an email notification using Resend API.
 * Includes retry logic with exponential backoff.
 *
 * @param payload - Email payload with to, subject, and body
 * @returns true if Resend confirms delivery, false otherwise
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const logger = createLogger({ service: "email" });
  const { to, subject, body } = payload;

  if (!to || !subject || !body) {
    logger.warn("email_invalid_payload", null, {
      to: Boolean(to),
      subject: Boolean(subject),
      body: Boolean(body),
    });
    return false;
  }

  // Check for Resend API configuration
  if (!ENV.resendApiKey) {
    logger.warn("email_not_configured", null, {
      reason: "Missing RESEND_API_KEY environment variable",
    });
    return false;
  }

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.info("email_attempt", {
        to,
        subject,
        attempt: attempt + 1,
        bodyLength: body.length,
      });

      // Call Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.resendApiKey}`,
        },
        body: JSON.stringify({
          from: ENV.resendFromEmail,
          to: [to],
          subject,
          html: body,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Resend API error: ${response.status} - ${errorBody}`);
      }

      const result = (await response.json()) as { id: string };

      logger.info("email_sent", {
        to,
        subject,
        resendId: result.id,
      });

      return true;
    } catch (error) {
      logger.error("email_attempt_failed", error, {
        to,
        subject,
        attempt: attempt + 1,
      });

      // Wait before retry (unless this was the last attempt)
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }
  }

  logger.error("email_failed_all_retries", null, {
    to,
    subject,
    attempts: MAX_RETRIES,
  });

  return false;
}

/**
 * Sends a welcome email to a mentorado when their profile is linked.
 */
export async function sendWelcomeEmail(
  email: string,
  nomeCompleto: string,
  _turma: string
): Promise<boolean> {
  const firstName = nomeCompleto.split(" ")[0];

  const content = `
    <div style="text-align: center;">
      <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
      <h2 style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.white}; font-size: 28px;">
        Bem-vindo ao Dashboard Neon!
      </h2>
    </div>
    <p style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Olá <strong style="color: ${NEON_BRAND_COLORS.white};">${firstName}</strong>! Seu perfil foi vinculado com sucesso.
    </p>
    <p style="margin: 0 0 20px 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Agora você pode acessar:
    </p>
    <ul style="margin: 0 0 30px 0; padding-left: 20px; color: ${NEON_BRAND_COLORS.gray}; font-size: 15px; line-height: 2;">
      <li>✅ Seu dashboard personalizado com suas métricas</li>
      <li>✅ Gráficos de evolução mensal</li>
      <li>✅ Feedbacks personalizados do mentor</li>
      <li>✅ Formulário de envio de métricas mensais</li>
      <li>✅ Comparativo com metas propostas</li>
      <li>✅ Sistema de badges e conquistas</li>
      <li>✅ Ranking da turma</li>
    </ul>
    ${ctaButton("Acessar Dashboard")}
    <p style="margin: 0; color: ${NEON_BRAND_COLORS.gray}; font-size: 14px; text-align: center;">
      Para acessar, basta fazer login com este email (${email}) no sistema.
    </p>
  `;

  const htmlBody = emailWrapper(content);

  return await sendEmail({
    to: email,
    subject: "🎉 Bem-vindo ao Dashboard Neon!",
    body: htmlBody,
  });
}
