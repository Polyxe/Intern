import "server-only";

import { Resend } from "resend";

type NotificationEmailAction = {
  label: string;
  path: string;
};

type NotificationEmailPayload = {
  to: string | string[];
  subject: string;
  heading: string;
  message: string;
  action?: NotificationEmailAction;
};

let resendClient: Resend | null | undefined;

function getEnvValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resolveOrigin(candidate: string) {
  if (!candidate) {
    return null;
  }

  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

function getAppBaseUrl() {
  const candidates = [
    getEnvValue("APP_BASE_URL"),
    getEnvValue("NEXT_PUBLIC_APP_URL"),
    getEnvValue("GOOGLE_OAUTH_CALLBACK_URL"),
    getEnvValue("CALLBACK_URL"),
  ];

  for (const candidate of candidates) {
    const origin = resolveOrigin(candidate);

    if (origin) {
      return origin;
    }
  }

  return "http://localhost:3000";
}

function getResendClient() {
  const apiKey = getEnvValue("RESEND_API_KEY");

  if (!apiKey) {
    return null;
  }

  if (resendClient === undefined) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

function getFromAddress() {
  return getEnvValue("RESEND_FROM_EMAIL") || getEnvValue("RESEND_FROM");
}

function buildActionUrl(action: NotificationEmailAction) {
  return new URL(action.path, getAppBaseUrl()).toString();
}

function buildHtmlEmail(payload: NotificationEmailPayload) {
  const safeHeading = escapeHtml(payload.heading);
  const safeMessage = escapeHtml(payload.message).replaceAll("\n", "<br />");
  const actionUrl = payload.action ? buildActionUrl(payload.action) : null;
  const actionLabel = payload.action ? escapeHtml(payload.action.label) : null;

  return `
    <div style="margin:0;background:#f6f5fb;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;border-radius:24px;background:#ffffff;padding:32px;border:1px solid rgba(148,163,184,0.18);box-shadow:0 18px 40px rgba(15,23,42,0.08);">
        <div style="display:inline-block;border-radius:999px;background:rgba(142,85,183,0.12);padding:8px 14px;font-size:12px;font-weight:700;letter-spacing:0.04em;color:#6d28d9;">Intern Wonderland</div>
        <h1 style="margin:20px 0 12px;font-size:24px;line-height:1.3;color:#1f2937;">${safeHeading}</h1>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">${safeMessage}</p>
        ${
          actionUrl && actionLabel
            ? `<div style="margin-top:24px;"><a href="${actionUrl}" style="display:inline-block;border-radius:999px;background:linear-gradient(135deg,#f26a21,#fb923c);padding:12px 18px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${actionLabel}</a></div>`
            : ""
        }
        <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#64748b;">อีเมลฉบับนี้ถูกส่งอัตโนมัติจากระบบติดตามการฝึกงาน</p>
      </div>
    </div>
  `;
}

function buildTextEmail(payload: NotificationEmailPayload) {
  const lines = [payload.heading, "", payload.message];

  if (payload.action) {
    lines.push("", `${payload.action.label}: ${buildActionUrl(payload.action)}`);
  }

  lines.push("", "อีเมลฉบับนี้ถูกส่งอัตโนมัติจากระบบติดตามการฝึกงาน");

  return lines.join("\n");
}

export async function sendNotificationEmail(payload: NotificationEmailPayload) {
  const resend = getResendClient();
  const from = getFromAddress();
  const recipients = (Array.isArray(payload.to) ? payload.to : [payload.to]).filter(Boolean);

  if (!resend || !from || recipients.length === 0) {
    return;
  }

  try {
    const html = buildHtmlEmail(payload);
    const text = buildTextEmail(payload);

    await Promise.all(
      recipients.map((recipient) =>
        resend.emails.send({
          from,
          to: recipient,
          subject: payload.subject,
          html,
          text,
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to send notification email.", error);
  }
}