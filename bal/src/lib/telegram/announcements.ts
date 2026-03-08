import { getTelegramCommunityConfig } from "@/lib/env";
import {
  formatEpochResultsAnnouncement,
  formatEpochStartedAnnouncement,
  formatPrizeDistributionAnnouncement
} from "@/lib/telegram/copy";
import { sendTelegramMessage } from "@/lib/telegram/client";

function getAnnouncementTarget(preferPublic = true) {
  const config = getTelegramCommunityConfig();
  if (!config.hasAnnouncements) {
    return null;
  }

  if (preferPublic && config.channelChatId) {
    return {
      chatId: config.channelChatId,
      threadId: null
    };
  }

  if (config.adminChatId) {
    return {
      chatId: config.adminChatId,
      threadId: config.adminThreadId
    };
  }

  if (config.channelChatId) {
    return {
      chatId: config.channelChatId,
      threadId: null
    };
  }

  return null;
}

function toShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

export async function announceEpochResults(input: {
  epochNumber: number;
  prizePoolSol: number;
  winners: Array<{ rank: number; agentName: string; pnlSol: number; prizeSol: number }>;
}) {
  const target = getAnnouncementTarget(true);
  if (!target) {
    return null;
  }

  return sendTelegramMessage({
    chatId: target.chatId,
    threadId: target.threadId,
    text: formatEpochResultsAnnouncement(input)
  });
}

export async function announceEpochStarted(input: {
  epochNumber: number;
  weekStart: string;
  weekEnd: string;
}) {
  const target = getAnnouncementTarget(true);
  if (!target) {
    return null;
  }

  return sendTelegramMessage({
    chatId: target.chatId,
    threadId: target.threadId,
    text: formatEpochStartedAnnouncement({
      epochNumber: input.epochNumber,
      weekStart: toShortDate(input.weekStart),
      weekEnd: toShortDate(input.weekEnd)
    })
  });
}

export async function announcePrizeDistributionSummary(input: {
  epochNumber: number;
  transferred: Array<{ rank: number; agentName: string; prizeSol: number; txSignature: string }>;
  failed: Array<{ rank: number | null; agentName: string; reason: string }>;
}) {
  const target = getAnnouncementTarget(input.failed.length === 0);
  if (!target) {
    return null;
  }

  return sendTelegramMessage({
    chatId: target.chatId,
    threadId: target.threadId,
    text: formatPrizeDistributionAnnouncement(input)
  });
}
