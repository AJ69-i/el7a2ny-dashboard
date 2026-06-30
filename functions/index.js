/**
 * El7a2ny Cloud Functions.
 *
 * onNewEmergency: when a record is created under /emergency, fan out an FCM
 * push to every operator device token stored under /fcmTokens. This delivers
 * alerts even when the dashboard tab is backgrounded or closed.
 *
 * Deploy: `firebase deploy --only functions` (requires the Blaze plan).
 */
const { onValueCreated } = require('firebase-functions/v2/database');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

exports.onNewEmergency = onValueCreated(
  { ref: '/emergency/{id}', region: 'us-central1' },
  async (event) => {
    const db = getDatabase();
    const snap = await db.ref('fcmTokens').get();
    if (!snap.exists()) return;

    const entries = [];
    snap.forEach((child) => {
      const token = child.val() && child.val().token;
      if (token) entries.push({ key: child.key, token });
    });
    if (!entries.length) return;

    const val = event.data.val() || {};
    const user = val.user || {};
    const where = [user.cityName, user.area].filter(Boolean).join(', ');
    const body = `${user.name || 'A customer'}${where ? ' — ' + where : ''}`;

    // Data-only message: the service worker renders it (full control, correct
    // asset/link paths per host, no double notification).
    const res = await getMessaging().sendEachForMulticast({
      tokens: entries.map((e) => e.token),
      data: {
        kind: 'emergency',
        id: String(event.params.id),
        title: 'New emergency request',
        body,
      },
      webpush: { headers: { Urgency: 'high' } },
    });

    // Remove tokens that are no longer valid so the list stays clean.
    const cleanup = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = (r.error && r.error.code) || '';
        if (
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-registration-token') ||
          code.includes('invalid-argument')
        ) {
          cleanup.push(db.ref('fcmTokens/' + entries[i].key).remove());
        }
      }
    });
    await Promise.all(cleanup);
  },
);
