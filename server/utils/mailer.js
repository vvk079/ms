// utils/mailer.js
// Provider-agnostic transactional email. If SMTP is configured via env vars the
// message is sent for real; otherwise the email is logged to the server console
// so flows (e.g. password reset) stay fully testable in development. Drop in any
// SMTP provider (SES, Postmark, Mailgun, Gmail…) with no code changes.
import nodemailer from 'nodemailer';

let transporter = null;

export const isMailEnabled = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isMailEnabled()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // implicit TLS on 465, STARTTLS otherwise
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

/**
 * Send an email. Resolves { delivered:boolean } — never throws for a missing
 * SMTP config, so callers can treat email as best-effort.
 */
export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`✉️   [email not configured] "${subject}" → ${to}\n${text || ''}`);
    return { delivered: false };
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || 'RICHBAYY <no-reply@richbayy.com>',
    to,
    subject,
    text,
    html,
  });
  return { delivered: true };
}
