/**
 * TradeQuip – Reminder Service
 * Sends SMS (Twilio) and Email reminders to workers who haven't submitted
 * Run with: node server/reminderService.js
 */

const twilio = require('twilio');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// ── CONFIG (move to .env in production) ──────────────────────────────────────
const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM  = process.env.TWILIO_FROM_NUMBER;   // e.g. +61412345678

const EMAIL_HOST   = process.env.EMAIL_HOST;           // smtp.sendgrid.net
const EMAIL_PORT   = process.env.EMAIL_PORT || 587;
const EMAIL_USER   = process.env.EMAIL_USER;
const EMAIL_PASS   = process.env.EMAIL_PASS;
const EMAIL_FROM   = process.env.EMAIL_FROM || 'no-reply@tradequip.com.au';

const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
const mailer = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// ── HELPERS ──────────────────────────────────────────────────────────────────
async function sendSMS(to, workerName) {
  const msg = `Hi ${workerName}, this is a reminder from TradeQuip to please submit your daily activity log. Tap here to log now: https://tradequip.app/log`;
  try {
    await twilioClient.messages.create({ body: msg, from: TWILIO_FROM, to });
    console.log(`✅ SMS sent to ${workerName} (${to})`);
  } catch (err) {
    console.error(`❌ SMS failed for ${workerName}:`, err.message);
  }
}

async function sendEmail(to, workerName) {
  try {
    await mailer.sendMail({
      from: `"TradeQuip Site Logger" <${EMAIL_FROM}>`,
      to,
      subject: `⏰ Daily Activity Log Reminder – ${new Date().toLocaleDateString('en-AU')}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;">
          <div style="background:#f47c1c;padding:20px 24px;border-radius:10px 10px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">TradeQuip Daily Log</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 10px 10px;">
            <p>Hi <strong>${workerName}</strong>,</p>
            <p>We noticed you haven't submitted your daily activity log yet for today (<strong>${new Date().toLocaleDateString('en-AU')}</strong>).</p>
            <p>Please take a moment to log your site visit, tasks completed, and any photos or notes.</p>
            <a href="https://tradequip.app/log" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#f47c1c;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Submit My Activity Log →</a>
            <p style="color:#888;font-size:13px;">If you've already submitted, please disregard this message. Contact your supervisor if you have any questions.</p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Email sent to ${workerName} (${to})`);
  } catch (err) {
    console.error(`❌ Email failed for ${workerName}:`, err.message);
  }
}

// ── FETCH PENDING WORKERS ────────────────────────────────────────────────────
// Replace this with your actual DB query
async function getPendingWorkers() {
  // Example: return workers who haven't submitted today
  return [
    { name: 'Tom Nguyen',  phone: '+61400000001', email: 'tom@example.com' },
    { name: 'Priya Mehta', phone: '+61400000002', email: 'priya@example.com' },
    { name: 'Sara Holmes', phone: '+61400000003', email: 'sara@example.com' },
  ];
}

// ── SEND REMINDERS ───────────────────────────────────────────────────────────
async function sendReminders(channel = 'both') {
  const workers = await getPendingWorkers();
  if (!workers.length) {
    console.log('✅ All workers have submitted. No reminders needed.');
    return;
  }
  console.log(`📨 Sending reminders to ${workers.length} worker(s)...`);
  for (const w of workers) {
    if (channel === 'sms' || channel === 'both') await sendSMS(w.phone, w.name);
    if (channel === 'email' || channel === 'both') await sendEmail(w.email, w.name);
  }
}

// ── SCHEDULE ─────────────────────────────────────────────────────────────────
// First reminder: 3pm AEST
cron.schedule('0 15 * * 1-5', () => {
  console.log('⏰ 3 PM – Sending first round of reminders (SMS)');
  sendReminders('sms');
}, { timezone: 'Australia/Sydney' });

// Second reminder: 5pm AEST (both SMS + email)
cron.schedule('0 17 * * 1-5', () => {
  console.log('⏰ 5 PM – Sending escalation reminders (SMS + Email)');
  sendReminders('both');
}, { timezone: 'Australia/Sydney' });

console.log('🟢 TradeQuip Reminder Service running...');
