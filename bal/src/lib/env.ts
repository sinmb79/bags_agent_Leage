const requiredSupabaseKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

export interface TelegramCommunityConfig {
  botToken: string | null;
  botUsername: string | null;
  webhookSecret: string | null;
  channelUrl: string | null;
  groupUrl: string | null;
  adminChatId: string | null;
  adminThreadId: number | null;
  channelChatId: string | null;
  appUrl: string;
  hasBot: boolean;
  hasAnnouncements: boolean;
  hasCommunityLinks: boolean;
}

export function hasEnvValue(name: string) {
  return Boolean(process.env[name] && process.env[name]?.trim());
}

export function hasSupabaseEnv() {
  return requiredSupabaseKeys.every((key) => hasEnvValue(key));
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function getOptionalEnv(name: string) {
  return hasEnvValue(name) ? process.env[name]!.trim() : null;
}

function getOptionalNumberEnv(name: string) {
  const value = getOptionalEnv(name);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getTelegramCommunityConfig(): TelegramCommunityConfig {
  const botToken = getOptionalEnv("TELEGRAM_BOT_TOKEN");
  const adminChatId = getOptionalEnv("TELEGRAM_ADMIN_CHAT_ID");
  const channelChatId = getOptionalEnv("TELEGRAM_CHANNEL_CHAT_ID");

  return {
    botToken,
    botUsername: getOptionalEnv("TELEGRAM_BOT_USERNAME"),
    webhookSecret: getOptionalEnv("TELEGRAM_WEBHOOK_SECRET"),
    channelUrl: getOptionalEnv("TELEGRAM_CHANNEL_URL"),
    groupUrl: getOptionalEnv("TELEGRAM_GROUP_URL"),
    adminChatId,
    adminThreadId: getOptionalNumberEnv("TELEGRAM_ADMIN_THREAD_ID"),
    channelChatId,
    appUrl: getBaseUrl(),
    hasBot: Boolean(botToken),
    hasAnnouncements: Boolean(botToken && (channelChatId || adminChatId)),
    hasCommunityLinks: Boolean(
      getOptionalEnv("TELEGRAM_CHANNEL_URL") ||
        getOptionalEnv("TELEGRAM_GROUP_URL") ||
        getOptionalEnv("TELEGRAM_BOT_USERNAME")
    )
  };
}

export function getTelegramBotDeepLink(startParam?: string) {
  const config = getTelegramCommunityConfig();
  if (!config.botUsername) {
    return null;
  }

  const encoded = startParam ? `?start=${encodeURIComponent(startParam)}` : "";
  return `https://t.me/${config.botUsername}${encoded}`;
}
