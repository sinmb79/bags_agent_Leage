import type { SupabaseClient } from "@supabase/supabase-js";
import { getTelegramCommunityConfig } from "@/lib/env";
import {
  cancelPendingPayoutItems,
  getEpochById,
  getPayoutBatchById,
  listPayoutItemsByBatch,
  updatePayoutBatch
} from "@/lib/supabase/queries";
import type { Database, PayoutBatchRow } from "@/lib/supabase/types";
import {
  answerTelegramCallbackQuery,
  editTelegramMessage,
  sendTelegramMessage,
  type TelegramCallbackQuery,
  type TelegramInlineKeyboardMarkup
} from "@/lib/telegram/client";
import {
  formatInsufficientFundsAlert,
  formatPartialFailureAlert,
  formatSettlementApprovalRequest,
  formatSettlementReminder,
  formatSettlementStatusUpdate
} from "@/lib/telegram/copy";

type Client = SupabaseClient<Database>;

function getAdminTarget() {
  const config = getTelegramCommunityConfig();
  if (!config.adminChatId) {
    return null;
  }

  return {
    chatId: config.adminChatId,
    threadId: config.adminThreadId
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

function getSettlementKeyboard(batch: PayoutBatchRow): TelegramInlineKeyboardMarkup {
  if (["completed", "cancelled", "partial_failure", "executing"].includes(batch.status)) {
    return {
      inline_keyboard: []
    };
  }

  if (batch.status === "approved") {
    return {
      inline_keyboard: [
        [
          { text: "Hold", callback_data: `hold_settlement:${batch.id}` },
          { text: "Cancel", callback_data: `cancel_settlement:${batch.id}` }
        ]
      ]
    };
  }

  return {
    inline_keyboard: [
      [
        { text: "Approve Settlement", callback_data: `approve_settlement:${batch.id}` },
        { text: "Hold", callback_data: `hold_settlement:${batch.id}` },
        { text: "Cancel", callback_data: `cancel_settlement:${batch.id}` }
      ]
    ]
  };
}

async function buildSettlementContext(client: Client, batchId: string) {
  const batch = await getPayoutBatchById(client, batchId);
  if (!batch) {
    return null;
  }

  const [epoch, items] = await Promise.all([
    getEpochById(client, batch.epoch_id),
    listPayoutItemsByBatch(client, batch.id)
  ]);

  return {
    batch,
    items,
    epochNumber: epoch?.epoch_number ?? 0
  };
}

export async function sendSettlementApprovalRequest(client: Client, payoutBatchId: string) {
  const target = getAdminTarget();
  if (!target) {
    return null;
  }

  const context = await buildSettlementContext(client, payoutBatchId);
  if (!context) {
    return null;
  }

  const sent = await sendTelegramMessage({
    chatId: target.chatId,
    threadId: target.threadId,
    text: formatSettlementApprovalRequest({
      batch: context.batch,
      items: context.items,
      epochNumber: context.epochNumber
    }),
    replyMarkup: getSettlementKeyboard(context.batch)
  });

  if (sent?.message_id) {
    await updatePayoutBatch(client, context.batch.id, {
      admin_message_id: String(sent.message_id)
    });
  }

  return sent;
}

export async function handleSettlementAdminCallback(client: Client, callbackQuery: TelegramCallbackQuery) {
  const data = callbackQuery.data ?? "";
  const [action, batchId] = data.split(":");

  if (!callbackQuery.message || !batchId) {
    await answerTelegramCallbackQuery({
      callbackQueryId: callbackQuery.id,
      text: "Invalid settlement action."
    });
    return;
  }

  const context = await buildSettlementContext(client, batchId);
  if (!context) {
    await answerTelegramCallbackQuery({
      callbackQueryId: callbackQuery.id,
      text: "Settlement batch not found."
    });
    return;
  }

  if (["completed", "cancelled", "executing"].includes(context.batch.status)) {
    await answerTelegramCallbackQuery({
      callbackQueryId: callbackQuery.id,
      text: `Batch is already ${context.batch.status}.`
    });
    return;
  }

  const handledBy = getActorLabel(callbackQuery.from);
  let updatedBatch = context.batch;

  switch (action) {
    case "approve_settlement":
      updatedBatch = await updatePayoutBatch(client, context.batch.id, {
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by_telegram_user_id: toTelegramStringId(callbackQuery.from.id),
        approved_by_telegram_username: callbackQuery.from.username ?? handledBy,
        failure_reason: null
      });
      break;
    case "hold_settlement":
      updatedBatch = await updatePayoutBatch(client, context.batch.id, {
        status: "held",
        failure_reason: "Held by admin."
      });
      break;
    case "cancel_settlement":
      updatedBatch = await updatePayoutBatch(client, context.batch.id, {
        status: "cancelled",
        failure_reason: "Cancelled by admin."
      });
      await cancelPendingPayoutItems(client, context.batch.id);
      break;
    default:
      await answerTelegramCallbackQuery({
        callbackQueryId: callbackQuery.id,
        text: "Unsupported settlement action."
      });
      return;
  }

  const updatedItems = await listPayoutItemsByBatch(client, context.batch.id);
  await editTelegramMessage({
    chatId: toTelegramStringId(callbackQuery.message.chat.id),
    messageId: callbackQuery.message.message_id,
    text: formatSettlementStatusUpdate({
      batch: updatedBatch,
      items: updatedItems,
      epochNumber: context.epochNumber,
      handledBy
    }),
    replyMarkup: getSettlementKeyboard(updatedBatch)
  });

  await answerTelegramCallbackQuery({
    callbackQueryId: callbackQuery.id,
    text: `Settlement marked as ${updatedBatch.status}.`
  });
}

export async function sendSettlementApprovalReminder(client: Client, payoutBatchId: string) {
  const target = getAdminTarget();
  if (!target) {
    return null;
  }

  const context = await buildSettlementContext(client, payoutBatchId);
  if (!context) {
    return null;
  }

  return sendTelegramMessage({
    chatId: target.chatId,
    threadId: target.threadId,
    text: formatSettlementReminder({
      batch: context.batch,
      epochNumber: context.epochNumber
    })
  });
}

export async function sendInsufficientFundsAlert(client: Client, input: {
  payoutBatchId: string;
  requiredSol: number;
  availableSol: number | null;
}) {
  const target = getAdminTarget();
  if (!target) {
    return null;
  }

  const context = await buildSettlementContext(client, input.payoutBatchId);
  if (!context) {
    return null;
  }

  return sendTelegramMessage({
    chatId: target.chatId,
    threadId: target.threadId,
    text: formatInsufficientFundsAlert({
      batch: context.batch,
      epochNumber: context.epochNumber,
      requiredSol: input.requiredSol,
      availableSol: input.availableSol
    })
  });
}

export async function sendPartialFailureAlert(client: Client, input: {
  payoutBatchId: string;
  failedItems: Array<{ label: string; reason: string }>;
}) {
  const target = getAdminTarget();
  if (!target) {
    return null;
  }

  const context = await buildSettlementContext(client, input.payoutBatchId);
  if (!context) {
    return null;
  }

  return sendTelegramMessage({
    chatId: target.chatId,
    threadId: target.threadId,
    text: formatPartialFailureAlert({
      batch: context.batch,
      epochNumber: context.epochNumber,
      failedItems: input.failedItems
    })
  });
}
