import type { PayoutBatchRow, PayoutItemRow, TelegramFeedbackRow } from "@/lib/supabase/types";
import { getBaseUrl, getTelegramBotDeepLink, getTelegramCommunityConfig } from "@/lib/env";
import { formatSol, shortenAddress } from "@/lib/utils";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

export function getStartMessage() {
  const config = getTelegramCommunityConfig();
  const lines = [
    "B.A.L. community bot",
    "This bot handles FAQ replies, link sharing, settlement approvals, and private feedback intake.",
    "",
    "Commands",
    "/help - available commands",
    "/faq - quick FAQ",
    "/links - channel, group, and site links",
    "/feedback - start a private feedback ticket"
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
    "Available actions",
    "- /faq for common questions",
    "- /links for community URLs",
    "- /feedback for bug reports, ideas, questions, or abuse reports",
    "",
    "Detailed feedback is collected in DM only. Group mentions are redirected into DM."
  ].join("\n");
}

export function getLinksMessage() {
  const config = getTelegramCommunityConfig();
  const feedbackLink = getTelegramBotDeepLink("feedback");

  return [
    "B.A.L. community links",
    `Website: ${config.appUrl}`,
    `Channel: ${config.channelUrl ?? "coming soon"}`,
    `Group: ${config.groupUrl ?? "coming soon"}`,
    `Feedback Bot: ${feedbackLink ?? "coming soon"}`
  ].join("\n");
}

export function getFeedbackStartMessage() {
  return [
    "Choose a feedback category first.",
    "In your next message, agent name and wallet are optional. The message body is required.",
    "",
    "Example",
    "Agent: Alpha Trader",
    "Wallet: So11111111111111111111111111111111111111112",
    "Message: The fill price looks different from the actual swap."
  ].join("\n");
}

export function getFeedbackPromptMessage(categoryLabel: string) {
  return [
    `Category: ${categoryLabel}`,
    "Now send the message body in DM.",
    "Agent name and wallet are optional. The message body is required."
  ].join("\n");
}

export function getFeedbackSavedMessage(feedbackId: string) {
  return [
    "Feedback saved.",
    `Ticket: ${feedbackId}`,
    "The operator team has been notified."
  ].join("\n");
}

export function getFeedbackUnavailableMessage() {
  return "Feedback intake is temporarily unavailable because the storage environment is not configured.";
}

export function getAwaitingCategoryReminder() {
  return "Choose a category button first. You can restart with /feedback.";
}

export function getFeedbackBodyRequiredMessage() {
  return "The message body is empty. Send at least one line describing the issue.";
}

export function getDmRedirectMessage() {
  return [
    "Detailed feedback is collected in bot DM, not in the public group.",
    "Open DM and run /feedback from there."
  ].join("\n");
}

export function getUnknownDmMessage() {
  return "Use /help or /feedback to continue.";
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

function formatSettlementItems(items: PayoutItemRow[]) {
  if (!items.length) {
    return "No payout items were generated.";
  }

  return items
    .map((item) => {
      const label = item.item_type === "operator_revenue" ? "Operator" : `#${item.rank ?? "-"} ${item.recipient_name}`;
      return `${label} | ${formatSol(Number(item.amount_sol ?? 0))} SOL | ${item.status}`;
    })
    .join("\n");
}

export function formatSettlementApprovalRequest(input: {
  batch: PayoutBatchRow;
  items: PayoutItemRow[];
  epochNumber: number;
}) {
  return [
    "Settlement approval required",
    `Epoch: #${input.epochNumber}`,
    `Status: ${input.batch.status}`,
    `Scheduled: ${formatTimestamp(input.batch.scheduled_for)}`,
    `Gross fee snapshot: ${formatSol(Number(input.batch.gross_fees_claimed_sol ?? 0))} SOL`,
    `Prize pool: ${formatSol(Number(input.batch.prize_pool_sol ?? 0))} SOL`,
    `Operator revenue: ${formatSol(Number(input.batch.operator_revenue_sol ?? 0))} SOL`,
    `Reserve: ${formatSol(Number(input.batch.reserve_sol ?? 0))} SOL`,
    `Projected reserve balance: ${formatSol(Number(input.batch.reserve_balance_after_epoch ?? 0))} SOL`,
    input.batch.failure_reason ? `Issue: ${input.batch.failure_reason}` : "",
    "",
    formatSettlementItems(input.items)
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatSettlementStatusUpdate(input: {
  batch: PayoutBatchRow;
  items: PayoutItemRow[];
  epochNumber: number;
  handledBy?: string | null;
}) {
  return [
    formatSettlementApprovalRequest({
      batch: input.batch,
      items: input.items,
      epochNumber: input.epochNumber
    }),
    input.handledBy ? `\nHandled by: ${input.handledBy}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatSettlementReminder(input: {
  batch: PayoutBatchRow;
  epochNumber: number;
}) {
  return [
    "Settlement approval reminder",
    `Epoch: #${input.epochNumber}`,
    `Status: ${input.batch.status}`,
    `Scheduled: ${formatTimestamp(input.batch.scheduled_for)}`,
    "The settlement batch has not been approved yet, so automated payout was skipped."
  ].join("\n");
}

export function formatInsufficientFundsAlert(input: {
  batch: PayoutBatchRow;
  epochNumber: number;
  requiredSol: number;
  availableSol: number | null;
}) {
  return [
    "Settlement blocked: insufficient treasury balance",
    `Epoch: #${input.epochNumber}`,
    `Required: ${formatSol(input.requiredSol)} SOL`,
    `Available: ${formatSol(input.availableSol ?? 0)} SOL`,
    `Batch status: ${input.batch.status}`
  ].join("\n");
}

export function formatPartialFailureAlert(input: {
  batch: PayoutBatchRow;
  epochNumber: number;
  failedItems: Array<{ label: string; reason: string }>;
}) {
  return [
    "Settlement partial failure",
    `Epoch: #${input.epochNumber}`,
    `Batch status: ${input.batch.status}`,
    "",
    ...input.failedItems.map((item) => `${item.label} | ${item.reason}`)
  ].join("\n");
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
