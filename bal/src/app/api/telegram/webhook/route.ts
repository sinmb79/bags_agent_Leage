import { getTelegramCommunityConfig } from "@/lib/env";
import { handleTelegramUpdate } from "@/lib/telegram/handlers";
import type { TelegramUpdate } from "@/lib/telegram/client";
import { errorResponse, successResponse } from "@/lib/response";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = getTelegramCommunityConfig().webhookSecret;
  if (!secret) {
    return false;
  }

  return request.headers.get("x-telegram-bot-api-secret-token") === secret;
}

export async function POST(request: Request) {
  try {
    const config = getTelegramCommunityConfig();
    if (!config.hasBot) {
      return errorResponse("Telegram bot is not configured.", 503);
    }

    if (!isAuthorized(request)) {
      return errorResponse("Unauthorized", 401);
    }

    const update = (await request.json()) as TelegramUpdate;
    await handleTelegramUpdate(createServerClient(), update);
    return successResponse({ ok: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to process Telegram update.");
  }
}
