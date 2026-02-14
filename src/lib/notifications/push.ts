import webPush from 'web-push';

let _initialized = false;

function ensureVapid() {
  if (_initialized) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.NEXT_PUBLIC_APP_URL ?? 'https://padelia.app';

  if (publicKey && privateKey) {
    webPush.setVapidDetails(subject, publicKey, privateKey);
    _initialized = true;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification(
  subscription: webPush.PushSubscription,
  payload: PushPayload,
) {
  ensureVapid();

  try {
    await webPush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 }, // 1 hour
    );
    return { success: true };
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    // 404 or 410 means subscription is expired/invalid
    if (statusCode === 404 || statusCode === 410) {
      return { success: false, expired: true };
    }
    console.error('[push] Send failed:', error);
    return { success: false, expired: false };
  }
}
