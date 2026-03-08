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

export interface SettlementConfig {
  partnerWallet: string | null;
  operatorWallet: string | null;
  prizeShareBps: number;
  revenueShareBps: number;
  reserveShareBps: number;
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

function readBpsEnv(name: string, fallback: number) {
  const value = getOptionalNumberEnv(name);
  if (value === null) {
    return fallback;
  }

  const rounded = Math.round(value);
  if (rounded < 0 || rounded > 10_000) {
    return fallback;
  }

  return rounded;
}

export function getSettlementConfig(): SettlementConfig {
  const defaults = {
    prizeShareBps: 7_000,
    revenueShareBps: 2_000,
    reserveShareBps: 1_000
  };

  const candidate = {
    prizeShareBps: readBpsEnv("BAL_PRIZE_SHARE_BPS", defaults.prizeShareBps),
    revenueShareBps: readBpsEnv("BAL_REVENUE_SHARE_BPS", defaults.revenueShareBps),
    reserveShareBps: readBpsEnv("BAL_RESERVE_SHARE_BPS", defaults.reserveShareBps)
  };

  const total = candidate.prizeShareBps + candidate.revenueShareBps + candidate.reserveShareBps;
  const normalized = total === 10_000 ? candidate : defaults;

  return {
    partnerWallet: getOptionalEnv("BAL_PARTNER_WALLET"),
    operatorWallet: getOptionalEnv("BAL_OPERATOR_WALLET"),
    ...normalized
  };
}
