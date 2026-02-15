import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = 'Padelia <noreply@padelia.app>';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const { error } = await getResend().emails.send({
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

export function welcomeEmail(playerName: string, appUrl: string) {
  return {
    subject: 'Bienvenue sur Padelia ! 🎾',
    html: `
      <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#0B1A2E;">🎾 Bienvenue ${playerName} !</h2>
        <p>Tu fais maintenant partie de la communauté Padelia. Voici ce que tu peux faire :</p>
        <ul style="color:#333;line-height:1.8;">
          <li><strong>Trouver des partenaires</strong> compatibles avec ton niveau</li>
          <li><strong>Créer ou rejoindre</strong> des matchs près de chez toi</li>
          <li><strong>Suivre ta progression</strong> avec notre système de classement</li>
          <li><strong>Rejoindre des groupes</strong> pour jouer régulièrement</li>
        </ul>
        <a href="${appUrl}/accueil" style="display:inline-block;background:#3EAF4B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">
          Commencer à jouer
        </a>
        <p style="color:#666;font-size:12px;margin-top:24px;">— L'équipe Padelia</p>
      </div>
    `,
  };
}

export function matchCompletedEmail(matchTitle: string, resultSummary: string, matchUrl: string) {
  return {
    subject: `Résultats : "${matchTitle}"`,
    html: `
      <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#0B1A2E;">🏆 Match terminé</h2>
        <p>Les résultats de <strong>${matchTitle}</strong> sont disponibles :</p>
        <p style="font-size:18px;font-weight:600;color:#0B1A2E;text-align:center;padding:12px;background:#f5f5f5;border-radius:8px;">${resultSummary}</p>
        <p>N'oublie pas de noter tes partenaires pour améliorer le matching !</p>
        <a href="${matchUrl}" style="display:inline-block;background:#3EAF4B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">
          Voir les détails
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
