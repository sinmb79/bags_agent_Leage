import { createNewEpoch, finalizeEpoch, getActiveEpoch } from "@/lib/epoch";
import { prepareSettlementBatch } from "@/lib/settlement";
import { errorResponse, successResponse } from "@/lib/response";
import { listAgents, listRankingsByEpoch } from "@/lib/supabase/queries";
import { createServerClient } from "@/lib/supabase/server";
import { announceEpochResults, announceEpochStarted } from "@/lib/telegram/announcements";
import { sendSettlementApprovalRequest } from "@/lib/telegram/settlement";

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
    let payoutBatchId: string | null = null;

    if (activeEpoch && new Date(activeEpoch.week_end).getTime() <= Date.now()) {
      const result = await finalizeEpoch(supabase, activeEpoch.id);
      const [agents, finalizedRankings] = await Promise.all([
        listAgents(supabase),
        listRankingsByEpoch(supabase, result.epoch.id)
      ]);
      const agentMap = new Map(agents.map((agent) => [agent.id, agent]));

      try {
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

      try {
        const winners = finalizedRankings
          .sort((left, right) => (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER))
          .filter((ranking) => (ranking.rank ?? 0) > 0 && (ranking.rank ?? 0) <= 3 && Number(ranking.prize_sol ?? 0) > 0)
          .map((ranking) => ({
            agentId: ranking.agent_id,
            agentName: agentMap.get(ranking.agent_id)?.name ?? "Unknown Agent",
            walletAddress: agentMap.get(ranking.agent_id)?.wallet_address ?? "",
            rankingId: ranking.id,
            rank: ranking.rank ?? 0,
            prizeSol: Number(ranking.prize_sol ?? 0)
          }));

        const settlementBatch = await prepareSettlementBatch(supabase, {
          epoch: result.epoch,
          winners
        });

        payoutBatchId = settlementBatch.batch.id;
        if (settlementBatch.created) {
          await sendSettlementApprovalRequest(supabase, settlementBatch.batch.id);
        }
      } catch (error) {
        console.error("settlement preparation failed", error);
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
      activeEpochId: nextEpoch.id,
      payoutBatchId
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to check epoch.");
  }
}
