import "server-only";

type TelegramNotificationAction = {
  label: string;
  path: string;
};

type TelegramNotificationPayload = {
  chatId: string;
  title: string;
  message: string;
  action?: TelegramNotificationAction;
};

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

function buildActionUrl(action: TelegramNotificationAction) {
  return new URL(action.path, getAppBaseUrl()).toString();
}

function buildTelegramMessage(payload: TelegramNotificationPayload) {
  const lines = [
    `<b>${escapeHtml(payload.title)}</b>`,
    "",
    escapeHtml(payload.message).replaceAll("\n", "\n"),
  ];

  if (payload.action) {
    lines.push(
      "",
      `<a href="${escapeHtml(buildActionUrl(payload.action))}">${escapeHtml(payload.action.label)}</a>`,
    );
  }

  return lines.join("\n");
}

export function getAdminTelegramChatId() {
  return getEnvValue("TELEGRAM_ADMIN_CHAT_ID");
}

export function getStudentTelegramChatId() {
  return getEnvValue("TELEGRAM_STUDENT_CHAT_ID");
}

export async function sendTelegramMessage(payload: TelegramNotificationPayload) {
  const botToken = getEnvValue("TELEGRAM_BOT_TOKEN");

  if (!botToken || !payload.chatId) {
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: payload.chatId,
        text: buildTelegramMessage(payload),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to send Telegram notification.", response.status, await response.text());
    }
  } catch (error) {
    console.error("Failed to send Telegram notification.", error);
  }
}