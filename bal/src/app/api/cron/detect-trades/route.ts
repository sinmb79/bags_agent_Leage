import { detectNewTrades } from "@/lib/trade-watcher";
import { errorResponse, successResponse } from "@/lib/response";
import { createServerClient } from "@/lib/supabase/server";
import { insertTrades, listAgents } from "@/lib/supabase/queries";

function isAuthorized(request: Request) {
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return errorResponse("Unauthorized", 401);
    }

    const supabase = createServerClient();
    if (!supabase) {
      return errorResponse("Supabase environment is not configured.", 500);
    }

    const agents = await listAgents(supabase);
    const trades = await detectNewTrades(
      supabase,
      agents.map((agent) => ({ id: agent.id, wallet_address: agent.wallet_address })),
      new Date(Date.now() - 6 * 60 * 1000)
    );

    const inserted = await insertTrades(supabase, trades);
    return successResponse({ newTrades: inserted.length });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to detect trades.");
  }
}

