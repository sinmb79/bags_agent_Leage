import type { SupabaseClient } from "@supabase/supabase-js";
import { getTelegramBotDeepLink, getTelegramCommunityConfig } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";
import {
  answerTelegramCallbackQuery,
  sendTelegramMessage,
  type TelegramInlineKeyboardMarkup,
  type TelegramMessage,
  type TelegramUpdate
} from "@/lib/telegram/client";
import {
  getDmRedirectMessage,
  getFeedbackUnavailableMessage,
  getHelpMessage,
  getLinksMessage,
  getStartMessage,
  getUnknownDmMessage
} from "@/lib/telegram/copy";
import { handleAdminFeedbackStatusCallback, handleFeedbackCategorySelection, handleFeedbackMessage, startFeedbackFlow } from "@/lib/telegram/feedback";
import { formatTelegramFaqMessage } from "@/lib/telegram/faq";
import { handleSettlementAdminCallback } from "@/lib/telegram/settlement";

type Client = SupabaseClient<Database> | null;

function getCommand(text: string, botUsername?: string | null) {
  const parts = text.trim().split(/\s+/);
  const first = parts[0];
  if (!first?.startsWith("/")) {
    return null;
  }

  const raw = first.slice(1);
  const [name, mention] = raw.split("@");
  if (mention && botUsername && mention.toLowerCase() !== botUsername.toLowerCase()) {
    return null;
  }

  return {
    name: name.toLowerCase(),
    args: parts.slice(1).join(" ").trim() || null
  };
}

function isPrivateMessage(message: TelegramMessage) {
  return message.chat.type === "private";
}

function mentionsBot(text: string, botUsername?: string | null) {
  if (!botUsername) {
    return false;
  }

  return text.toLowerCase().includes(`@${botUsername.toLowerCase()}`);
}

function getRedirectKeyboard(): TelegramInlineKeyboardMarkup | undefined {
  const feedbackLink = getTelegramBotDeepLink("feedback");
  const config = getTelegramCommunityConfig();
  const buttons: TelegramInlineKeyboardMarkup["inline_keyboard"] = [];

  if (feedbackLink) {
    buttons.push([{ text: "Open DM", url: feedbackLink }]);
  }

  if (config.groupUrl || config.channelUrl) {
    buttons.push(
      [
        config.groupUrl ? { text: "Group", url: config.groupUrl } : null,
        config.channelUrl ? { text: "Channel", url: config.channelUrl } : null
      ].filter(Boolean) as Array<{ text: string; url: string }>
    );
  }

  return buttons.length ? { inline_keyboard: buttons } : undefined;
}

async function sendDmCommandResponse(client: Client, message: TelegramMessage, command: string, args?: string | null) {
  const chatId = String(message.chat.id);

  switch (command) {
    case "start":
      if (args === "feedback") {
        if (!client) {
          await sendTelegramMessage({ chatId, text: getFeedbackUnavailableMessage() });
          return;
        }

        await startFeedbackFlow(client, message, "group_redirect");
        return;
      }

      await sendTelegramMessage({ chatId, text: getStartMessage(), replyMarkup: getRedirectKeyboard() });
      return;
    case "help":
      await sendTelegramMessage({ chatId, text: getHelpMessage(), replyMarkup: getRedirectKeyboard() });
      return;
    case "faq":
      await sendTelegramMessage({ chatId, text: formatTelegramFaqMessage() });
      return;
    case "links":
      await sendTelegramMessage({ chatId, text: getLinksMessage(), replyMarkup: getRedirectKeyboard() });
      return;
    case "feedback":
      if (!client) {
        await sendTelegramMessage({ chatId, text: getFeedbackUnavailableMessage() });
        return;
      }

      await startFeedbackFlow(client, message, "bot_dm");
      return;
    default:
      await sendTelegramMessage({ chatId, text: getHelpMessage() });
  }
}

async function handleGroupMessage(message: TelegramMessage) {
  const text = message.text?.trim();
  if (!text) {
    return;
  }

  const config = getTelegramCommunityConfig();
  const command = getCommand(text, config.botUsername);
  const shouldRedirect =
    Boolean(command && ["help", "faq", "links", "feedback", "start"].includes(command.name)) ||
    mentionsBot(text, config.botUsername);

  if (!shouldRedirect) {
    return;
  }

  await sendTelegramMessage({
    chatId: String(message.chat.id),
    text: getDmRedirectMessage(),
    replyMarkup: getRedirectKeyboard()
  });
}

export async function handleTelegramUpdate(client: Client, update: TelegramUpdate) {
  const callbackQuery = update.callback_query;
  if (callbackQuery?.data) {
    if (callbackQuery.data.startsWith("feedback_category:")) {
      if (!client) {
        await answerTelegramCallbackQuery({
          callbackQueryId: callbackQuery.id,
          text: getFeedbackUnavailableMessage(),
          showAlert: true
        });
        return;
      }

      await handleFeedbackCategorySelection(client, callbackQuery);
      return;
    }

    if (callbackQuery.data.startsWith("feedback_status:")) {
      if (!client) {
        await answerTelegramCallbackQuery({
          callbackQueryId: callbackQuery.id,
          text: getFeedbackUnavailableMessage(),
          showAlert: true
        });
        return;
      }

      await handleAdminFeedbackStatusCallback(client, callbackQuery);
      return;
    }

    if (
      callbackQuery.data.startsWith("approve_settlement:") ||
      callbackQuery.data.startsWith("hold_settlement:") ||
      callbackQuery.data.startsWith("cancel_settlement:")
    ) {
      if (!client) {
        await answerTelegramCallbackQuery({
          callbackQueryId: callbackQuery.id,
          text: getFeedbackUnavailableMessage(),
          showAlert: true
        });
        return;
      }

      await handleSettlementAdminCallback(client, callbackQuery);
      return;
    }

    await answerTelegramCallbackQuery({
      callbackQueryId: callbackQuery.id,
      text: "Unsupported action."
    });
    return;
  }

  const message = update.message;
  if (!message) {
    return;
  }

  const text = message.text?.trim();
  if (!text) {
    return;
  }

  const config = getTelegramCommunityConfig();
  const command = getCommand(text, config.botUsername);

  if (isPrivateMessage(message)) {
    if (command) {
      await sendDmCommandResponse(client, message, command.name, command.args);
      return;
    }

    if (client) {
      const consumed = await handleFeedbackMessage(client, message);
      if (consumed) {
        return;
      }
    }

    await sendTelegramMessage({
      chatId: String(message.chat.id),
      text: getUnknownDmMessage()
    });
    return;
  }

  await handleGroupMessage(message);
}
