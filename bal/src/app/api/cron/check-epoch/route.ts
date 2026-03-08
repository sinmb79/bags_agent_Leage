import { createNewEpoch, finalizeEpoch, getActiveEpoch } from "@/lib/epoch";
import { errorResponse, successResponse } from "@/lib/response";
import { listAgents } from "@/lib/supabase/queries";
import { createServerClient } from "@/lib/supabase/server";
import { announceEpochResults, announceEpochStarted } from "@/lib/telegram/announcements";

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

    const activeEpoch = await getActiveEpoch(supabase);
    let finalized = false;

    if (activeEpoch && new Date(activeEpoch.week_end).getTime() <= Date.now()) {
      const result = await finalizeEpoch(supabase, activeEpoch.id);

      try {
        const agents = await listAgents(supabase);
        const agentMap = new Map(agents.map((agent) => [agent.id, agent]));

        await announceEpochResults({
          epochNumber: result.epoch.epoch_number,
          prizePoolSol: Number(result.epoch.prize_pool_sol ?? 0),
          winners: result.placements.slice(0, 3).map((placement) => ({
            rank: placement.rank,
            agentName: agentMap.get(placement.agentId)?.name ?? "Unknown Agent",
            pnlSol: placement.pnlSol,
            prizeSol: placement.prizeSol
          }))
        });
      } catch (error) {
        console.error("announceEpochResults failed", error);
      }

      finalized = true;
    }

    const nextEpoch = await createNewEpoch(supabase);

    if (!activeEpoch || nextEpoch.id !== activeEpoch.id) {
      try {
        await announceEpochStarted({
          epochNumber: nextEpoch.epoch_number,
          weekStart: nextEpoch.week_start,
          weekEnd: nextEpoch.week_end
        });
      } catch (error) {
        console.error("announceEpochStarted failed", error);
      }
    }

    return successResponse({
      finalized,
      activeEpochId: nextEpoch.id
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to check epoch.");
  }
}
