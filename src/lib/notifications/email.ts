import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Padelia <noreply@padelia.app>';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[email] Send failed:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('[email] Error:', error);
    return { success: false };
  }
}

// Email templates
export function matchInviteEmail(matchTitle: string, inviterName: string, matchUrl: string) {
  return {
    subject: `${inviterName} t'invite à un match de padel !`,
    html: `
      <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#0B1A2E;">🎾 Invitation Match</h2>
        <p><strong>${inviterName}</strong> t'invite à rejoindre le match <strong>${matchTitle}</strong>.</p>
        <a href="${matchUrl}" style="display:inline-block;background:#3EAF4B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">
          Voir le match
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px;">— L'équipe Padelia</p>
      </div>
    `,
  };
}

export function matchReminderEmail(matchTitle: string, dateStr: string, matchUrl: string) {
  return {
    subject: `Rappel : match "${matchTitle}" bientôt !`,
    html: `
      <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#0B1A2E;">⏰ Rappel Match</h2>
        <p>Ton match <strong>${matchTitle}</strong> est prévu le <strong>${dateStr}</strong>.</p>
        <a href="${matchUrl}" style="display:inline-block;background:#3EAF4B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">
          Voir le match
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px;">— L'équipe Padelia</p>
      </div>
    `,
  };
}
