import { getTelegramCommunityConfig } from "@/lib/env";

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

interface TelegramApiResponse<T> {
  ok: boolean;
  description?: string;
  result: T;
}

interface TelegramMessageResponse {
  message_id: number;
}

async function callTelegramApi<T>(method: string, payload: Record<string, unknown>): Promise<T | null> {
  const config = getTelegramCommunityConfig();
  if (!config.botToken) {
    return null;
  }

  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const json = (await response.json()) as TelegramApiResponse<T>;
  if (!response.ok || !json.ok) {
    throw new Error(json.description ?? `Telegram API call failed: ${method}`);
  }

  return json.result;
}

export async function sendTelegramMessage(input: {
  chatId: string;
  text: string;
  replyMarkup?: TelegramInlineKeyboardMarkup;
  threadId?: number | null;
  disableWebPagePreview?: boolean;
}) {
  return callTelegramApi<TelegramMessageResponse>("sendMessage", {
    chat_id: input.chatId,
    text: input.text,
    disable_web_page_preview: input.disableWebPagePreview ?? true,
    ...(input.replyMarkup ? { reply_markup: input.replyMarkup } : {}),
    ...(input.threadId ? { message_thread_id: input.threadId } : {})
  });
}

export async function editTelegramMessage(input: {
  chatId: string;
  messageId: number;
  text: string;
  replyMarkup?: TelegramInlineKeyboardMarkup;
}) {
  return callTelegramApi<TelegramMessageResponse>("editMessageText", {
    chat_id: input.chatId,
    message_id: input.messageId,
    text: input.text,
    disable_web_page_preview: true,
    ...(input.replyMarkup ? { reply_markup: input.replyMarkup } : {})
  });
}

export async function answerTelegramCallbackQuery(input: {
  callbackQueryId: string;
  text?: string;
  showAlert?: boolean;
}) {
  return callTelegramApi<boolean>("answerCallbackQuery", {
    callback_query_id: input.callbackQueryId,
    ...(input.text ? { text: input.text } : {}),
    ...(input.showAlert ? { show_alert: true } : {})
  });
}
