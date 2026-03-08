import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TelegramFeedbackRow } from "@/lib/supabase/types";
import {
  clearTelegramUserState,
  createTelegramFeedback,
  getTelegramFeedbackById,
  getTelegramUserState,
  matchAgentByWalletOrName,
  updateTelegramFeedback,
  updateTelegramFeedbackStatus,
  upsertTelegramUserState
} from "@/lib/supabase/queries";
import {
  answerTelegramCallbackQuery,
  editTelegramMessage,
  sendTelegramMessage,
  type TelegramCallbackQuery,
  type TelegramInlineKeyboardMarkup,
  type TelegramMessage
} from "@/lib/telegram/client";
import {
  formatAdminFeedbackAlert,
  formatAdminFeedbackUpdatedAlert,
  getAwaitingCategoryReminder,
  getFeedbackBodyRequiredMessage,
  getFeedbackPromptMessage,
  getFeedbackSavedMessage,
  getFeedbackStartMessage
} from "@/lib/telegram/copy";
import { getTelegramCommunityConfig } from "@/lib/env";
import type { TelegramFeedbackCategory, TelegramFeedbackSource } from "@/types";

type Client = SupabaseClient<Database>;

const DRAFT_SEPARATOR = "::";
const PENDING_MARKER = "pending";

export const TELEGRAM_FEEDBACK_CATEGORIES: Array<{
  value: TelegramFeedbackCategory;
  label: string;
}> = [
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idea" },
  { value: "question", label: "Question" },
  { value: "report", label: "Report" },
  { value: "other", label: "Other" }
];

function encodeDraftState(category: TelegramFeedbackCategory | null, source: TelegramFeedbackSource) {
  return `${category ?? PENDING_MARKER}${DRAFT_SEPARATOR}${source}`;
}

function decodeDraftState(value: string | null | undefined) {
  if (!value) {
    return { category: null, source: "bot_dm" as TelegramFeedbackSource };
  }

  const [categoryValue, sourceValue] = value.split(DRAFT_SEPARATOR);
  return {
    category:
      categoryValue && categoryValue !== PENDING_MARKER
        ? (categoryValue as TelegramFeedbackCategory)
        : null,
    source:
      sourceValue === "group_redirect"
        ? ("group_redirect" as TelegramFeedbackSource)
        : ("bot_dm" as TelegramFeedbackSource)
  };
}

export function getCategoryLabel(category: TelegramFeedbackCategory) {
  return TELEGRAM_FEEDBACK_CATEGORIES.find((item) => item.value === category)?.label ?? category;
}

function getFeedbackCategoryKeyboard(): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: TELEGRAM_FEEDBACK_CATEGORIES.map((item) => [
      {
        text: item.label,
        callback_data: `feedback_category:${item.value}`
      }
    ])
  };
}

function getAdminStatusKeyboard(
  feedbackId: string,
  status: TelegramFeedbackRow["status"]
): TelegramInlineKeyboardMarkup {
  if (status === "closed") {
    return {
      inline_keyboard: []
    };
  }

  if (status === "acknowledged") {
    return {
      inline_keyboard: [
        [
          {
            text: "Close",
            callback_data: `feedback_status:${feedbackId}:closed`
          }
        ]
      ]
    };
  }

  return {
    inline_keyboard: [
      [
        {
          text: "Acknowledge",
          callback_data: `feedback_status:${feedbackId}:acknowledged`
        },
        {
          text: "Close",
          callback_data: `feedback_status:${feedbackId}:closed`
        }
      ]
    ]
  };
}

function toTelegramStringId(value: number) {
  return String(value);
}

function getActorLabel(input: { username?: string; first_name?: string; last_name?: string }) {
  if (input.username) {
    return `@${input.username}`;
  }

  return [input.first_name, input.last_name].filter(Boolean).join(" ").trim() || "unknown";
}

function parseMetadataLine(line: string, keys: string[]) {
  const lower = line.toLowerCase();
  for (const key of keys) {
    if (lower.startsWith(key)) {
      const value = line.slice(key.length).trim();
      return value || null;
    }
  }

  return null;
}

function parseFeedbackBody(text: string) {
  let agentName: string | null = null;
  let walletAddress: string | null = null;
  const messageLines: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      messageLines.push(rawLine);
      continue;
    }

    if (!agentName) {
      const parsedAgent = parseMetadataLine(line, ["agent:", "agent name:"]);
      if (parsedAgent) {
        agentName = parsedAgent;
        continue;
      }
    }

    if (!walletAddress) {
      const parsedWallet = parseMetadataLine(line, ["wallet:", "wallet address:"]);
      if (parsedWallet) {
        walletAddress = parsedWallet;
        continue;
      }
    }

    messageLines.push(rawLine);
  }

  const message = messageLines.join("\n").trim();
  return {
    agentName,
    walletAddress,
    message
  };
}

async function notifyAdmin(feedback: TelegramFeedbackRow, linkedAgentName?: string | null) {
  const config = getTelegramCommunityConfig();
  if (!config.adminChatId) {
    return null;
  }

  return sendTelegramMessage({
    chatId: config.adminChatId,
    threadId: config.adminThreadId,
    text: formatAdminFeedbackAlert(feedback, linkedAgentName),
    replyMarkup: getAdminStatusKeyboard(feedback.id, feedback.status)
  });
}

export async function startFeedbackFlow(
  client: Client,
  message: TelegramMessage,
  source: TelegramFeedbackSource = "bot_dm"
) {
  if (!message.from) {
    return;
  }

  await upsertTelegramUserState(client, {
    telegram_user_id: toTelegramStringId(message.from.id),
    telegram_chat_id: toTelegramStringId(message.chat.id),
    state: "awaiting_category",
    draft_category: encodeDraftState(null, source)
  });

  await sendTelegramMessage({
    chatId: toTelegramStringId(message.chat.id),
    text: getFeedbackStartMessage(),
    replyMarkup: getFeedbackCategoryKeyboard()
  });
}

export async function handleFeedbackCategorySelection(client: Client, callbackQuery: TelegramCallbackQuery) {
  const data = callbackQuery.data ?? "";
  const category = data.split(":")[1] as TelegramFeedbackCategory | undefined;
  const categoryItem = TELEGRAM_FEEDBACK_CATEGORIES.find((item) => item.value === category);

  if (!callbackQuery.message || !categoryItem) {
    await answerTelegramCallbackQuery({
      callbackQueryId: callbackQuery.id,
      text: "Invalid category."
    });
    return;
  }

  const telegramUserId = toTelegramStringId(callbackQuery.from.id);
  const existingState = await getTelegramUserState(client, telegramUserId);
  const { source } = decodeDraftState(existingState?.draft_category);

  await upsertTelegramUserState(client, {
    telegram_user_id: telegramUserId,
    telegram_chat_id: toTelegramStringId(callbackQuery.message.chat.id),
    state: "awaiting_message",
    draft_category: encodeDraftState(categoryItem.value, source)
  });

  await answerTelegramCallbackQuery({
    callbackQueryId: callbackQuery.id,
    text: `${categoryItem.label} selected`
  });

  await editTelegramMessage({
    chatId: toTelegramStringId(callbackQuery.message.chat.id),
    messageId: callbackQuery.message.message_id,
    text: `Category selected: ${categoryItem.label}`,
    replyMarkup: {
      inline_keyboard: []
    }
  });

  await sendTelegramMessage({
    chatId: toTelegramStringId(callbackQuery.message.chat.id),
    text: getFeedbackPromptMessage(categoryItem.label)
  });
}

export async function handleFeedbackMessage(client: Client, message: TelegramMessage) {
  if (!message.from || !message.text) {
    return false;
  }

  const telegramUserId = toTelegramStringId(message.from.id);
  const state = await getTelegramUserState(client, telegramUserId);
  if (!state || state.state === "idle") {
    return false;
  }

  if (state.state === "awaiting_category") {
    await sendTelegramMessage({
      chatId: toTelegramStringId(message.chat.id),
      text: getAwaitingCategoryReminder()
    });
    return true;
  }

  const { category, source } = decodeDraftState(state.draft_category);
  if (!category) {
    await sendTelegramMessage({
      chatId: toTelegramStringId(message.chat.id),
      text: getAwaitingCategoryReminder()
    });
    return true;
  }

  const parsed = parseFeedbackBody(message.text);
  if (!parsed.message) {
    await sendTelegramMessage({
      chatId: toTelegramStringId(message.chat.id),
      text: getFeedbackBodyRequiredMessage()
    });
    return true;
  }

  const linkedAgent = await matchAgentByWalletOrName(client, {
    walletAddress: parsed.walletAddress,
    agentName: parsed.agentName
  });

  let feedback = await createTelegramFeedback(client, {
    telegram_user_id: telegramUserId,
    telegram_username: message.from.username ?? null,
    telegram_chat_id: toTelegramStringId(message.chat.id),
    source,
    category,
    message: parsed.message,
    agent_name: parsed.agentName,
    wallet_address: parsed.walletAddress,
    linked_agent_id: linkedAgent?.id ?? null
  });

  const adminMessage = await notifyAdmin(feedback, linkedAgent?.name ?? null);
  if (adminMessage?.message_id) {
    feedback = await updateTelegramFeedback(client, feedback.id, {
      admin_message_id: String(adminMessage.message_id)
    });
  }

  await clearTelegramUserState(client, telegramUserId, toTelegramStringId(message.chat.id));
  await sendTelegramMessage({
    chatId: toTelegramStringId(message.chat.id),
    text: getFeedbackSavedMessage(feedback.id)
  });

  return true;
}

export async function handleAdminFeedbackStatusCallback(client: Client, callbackQuery: TelegramCallbackQuery) {
  const data = callbackQuery.data ?? "";
  const [, feedbackId, nextStatus] = data.split(":");

  if (!callbackQuery.message || !feedbackId || (nextStatus !== "acknowledged" && nextStatus !== "closed")) {
    await answerTelegramCallbackQuery({
      callbackQueryId: callbackQuery.id,
      text: "Invalid action."
    });
    return;
  }

  const existing = await getTelegramFeedbackById(client, feedbackId);
  if (!existing) {
    await answerTelegramCallbackQuery({
      callbackQueryId: callbackQuery.id,
      text: "Feedback not found."
    });
    return;
  }

  if (existing.status === nextStatus) {
    await answerTelegramCallbackQuery({
      callbackQueryId: callbackQuery.id,
      text: `Already ${nextStatus}.`
    });
    return;
  }

  if (existing.status === "closed") {
    await answerTelegramCallbackQuery({
      callbackQueryId: callbackQuery.id,
      text: "Already closed."
    });
    return;
  }

  const updated = await updateTelegramFeedbackStatus(client, feedbackId, nextStatus);
  const handledBy = getActorLabel(callbackQuery.from);

  await editTelegramMessage({
    chatId: toTelegramStringId(callbackQuery.message.chat.id),
    messageId: callbackQuery.message.message_id,
    text: formatAdminFeedbackUpdatedAlert(updated, handledBy),
    replyMarkup: getAdminStatusKeyboard(updated.id, updated.status)
  });

  await answerTelegramCallbackQuery({
    callbackQueryId: callbackQuery.id,
    text: `Marked as ${nextStatus}.`
  });
}
