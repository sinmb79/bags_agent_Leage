import type { TelegramFeedbackRow } from "@/lib/supabase/types";
import { getBaseUrl, getTelegramBotDeepLink, getTelegramCommunityConfig } from "@/lib/env";
import { formatSol, shortenAddress } from "@/lib/utils";

export function getStartMessage() {
  const config = getTelegramCommunityConfig();
  const lines = [
    "B.A.L. community bot입니다.",
    "이 봇은 FAQ 안내, 링크 공유, 피드백 접수를 담당합니다.",
    "",
    "Commands",
    "/help - 사용 가능한 기능",
    "/faq - 자주 묻는 질문",
    "/links - 채널, 그룹, 웹 링크",
    "/feedback - 피드백 접수 시작"
  ];

  if (config.channelUrl || config.groupUrl) {
    lines.push("", "Community");
    if (config.channelUrl) {
      lines.push(`Channel: ${config.channelUrl}`);
    }
    if (config.groupUrl) {
      lines.push(`Group: ${config.groupUrl}`);
    }
  }

  lines.push("", `Website: ${getBaseUrl()}`);
  return lines.join("\n");
}

export function getHelpMessage() {
  return [
    "무엇을 할 수 있나요?",
    "- /faq 로 핵심 안내를 확인합니다.",
    "- /links 로 채널, 그룹, 웹사이트 링크를 받습니다.",
    "- /feedback 로 버그, 아이디어, 질문, 신고를 운영진에게 전달합니다.",
    "",
    "피드백은 DM에서만 받습니다. 그룹에서는 /feedback 입력 시 DM 링크로 안내됩니다."
  ].join("\n");
}

export function getLinksMessage() {
  const config = getTelegramCommunityConfig();
  const feedbackLink = getTelegramBotDeepLink("feedback");

  return [
    "B.A.L. community links",
    `Website: ${config.appUrl}`,
    `Channel: ${config.channelUrl ?? "준비 중"}`,
    `Group: ${config.groupUrl ?? "준비 중"}`,
    `Feedback Bot: ${feedbackLink ?? "준비 중"}`
  ].join("\n");
}

export function getFeedbackStartMessage() {
  return [
    "피드백 카테고리를 먼저 선택해주세요.",
    "다음 메시지에서 에이전트 이름과 지갑 주소는 선택적으로 남길 수 있고, 본문은 필수입니다.",
    "",
    "예시",
    "Agent: Alpha Trader",
    "Wallet: So11111111111111111111111111111111111111112",
    "본문: 체결가 계산이 실제와 다르게 보입니다."
  ].join("\n");
}

export function getFeedbackPromptMessage(categoryLabel: string) {
  return [
    `카테고리: ${categoryLabel}`,
    "이제 DM으로 피드백 본문을 보내주세요.",
    "에이전트 이름과 지갑 주소는 선택, 본문은 필수입니다."
  ].join("\n");
}

export function getFeedbackSavedMessage(feedbackId: string) {
  return [
    "피드백이 접수되었습니다.",
    `Ticket: ${feedbackId}`,
    "운영진에게 바로 전달했고, 필요하면 Telegram에서 추가로 안내하겠습니다."
  ].join("\n");
}

export function getFeedbackUnavailableMessage() {
  return "현재 피드백 저장 환경이 연결되지 않아 접수를 잠시 받을 수 없습니다.";
}

export function getAwaitingCategoryReminder() {
  return "카테고리 버튼을 먼저 선택해주세요. /feedback 명령으로 다시 시작할 수 있습니다.";
}

export function getFeedbackBodyRequiredMessage() {
  return "본문이 비어 있습니다. 한 줄 이상 설명을 보내주세요.";
}

export function getDmRedirectMessage() {
  return [
    "피드백은 그룹이 아니라 봇 DM으로 받습니다.",
    "아래 버튼으로 DM을 열고 /feedback 을 시작해주세요."
  ].join("\n");
}

export function getUnknownDmMessage() {
  return "도움이 필요하면 /help 또는 /feedback 을 입력해주세요.";
}

export function formatAdminFeedbackAlert(
  feedback: TelegramFeedbackRow,
  linkedAgentName?: string | null
) {
  const lines = [
    "New B.A.L. feedback",
    `Status: ${feedback.status}`,
    `Category: ${feedback.category}`,
    `Source: ${feedback.source}`,
    `User: ${feedback.telegram_username ? `@${feedback.telegram_username}` : feedback.telegram_user_id}`
  ];

  if (feedback.agent_name || linkedAgentName) {
    lines.push(`Agent: ${linkedAgentName ?? feedback.agent_name}`);
  }

  if (feedback.wallet_address) {
    lines.push(`Wallet: ${shortenAddress(feedback.wallet_address, 6, 6)}`);
  }

  if (feedback.linked_agent_id) {
    lines.push(`Linked Agent ID: ${feedback.linked_agent_id}`);
  }

  lines.push("", feedback.message);
  return lines.join("\n");
}

export function formatAdminFeedbackUpdatedAlert(
  feedback: TelegramFeedbackRow,
  handledBy?: string | null
) {
  const lines = [formatAdminFeedbackAlert(feedback)];

  if (handledBy) {
    lines.push("", `Handled by: ${handledBy}`);
  }

  return lines.join("\n");
}

export function formatEpochResultsAnnouncement(input: {
  epochNumber: number;
  prizePoolSol: number;
  winners: Array<{ rank: number; agentName: string; pnlSol: number; prizeSol: number }>;
}) {
  const winnerLines = input.winners.length
    ? input.winners
        .map(
          (winner) =>
            `#${winner.rank} ${winner.agentName} | PnL ${formatSol(winner.pnlSol)} SOL | Prize ${formatSol(winner.prizeSol)} SOL`
        )
        .join("\n")
    : "Top 3 data is not available yet.";

  return [
    `Epoch #${input.epochNumber} closed.`,
    `Prize Pool: ${formatSol(input.prizePoolSol)} SOL`,
    "",
    winnerLines
  ].join("\n");
}

export function formatEpochStartedAnnouncement(input: {
  epochNumber: number;
  weekStart: string;
  weekEnd: string;
}) {
  return [
    `Epoch #${input.epochNumber} is now live.`,
    `Window: ${input.weekStart} -> ${input.weekEnd}`,
    "Trade on Bags.fm and the next leaderboard update will pick you up."
  ].join("\n");
}

export function formatPrizeDistributionAnnouncement(input: {
  epochNumber: number;
  transferred: Array<{ rank: number; agentName: string; prizeSol: number; txSignature: string }>;
  failed: Array<{ rank: number | null; agentName: string; reason: string }>;
}) {
  const transferredLines = input.transferred.length
    ? input.transferred
        .map(
          (winner) =>
            `#${winner.rank} ${winner.agentName} | ${formatSol(winner.prizeSol)} SOL | ${winner.txSignature}`
        )
        .join("\n")
    : "No prize transfers were completed.";

  const failedLines = input.failed.length
    ? ["", "Failed transfers", ...input.failed.map((item) => `#${item.rank ?? "-"} ${item.agentName} | ${item.reason}`)].join(
        "\n"
      )
    : "";

  return [`Prize distribution summary for epoch #${input.epochNumber}`, "", transferredLines, failedLines]
    .filter(Boolean)
    .join("\n");
}
