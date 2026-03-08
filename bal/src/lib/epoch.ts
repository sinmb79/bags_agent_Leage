import type { SupabaseClient } from "@supabase/supabase-js";
import { getWeeklyFeeTotal } from "@/lib/bags/partner";
import { calculateSettlementBreakdown, getReserveBalance } from "@/lib/settlement";
import {
  createEpoch as createEpochRow,
  getActiveEpoch as getActiveEpochRow,
  getEpochById,
  listEpochs,
  listRankingsByEpoch,
  updateEpoch,
  upsertRanking
} from "@/lib/supabase/queries";
import type { EpochRow } from "@/lib/supabase/types";

type Client = SupabaseClient;

function getUtcMonday(date = new Date()) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  const day = result.getUTCDay();
  const distanceToMonday = (day + 6) % 7;
  result.setUTCDate(result.getUTCDate() - distanceToMonday);
  return result;
}

function getUtcSundayEnd(monday: Date) {
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 0);
  return sunday;
}

export async function getActiveEpoch(client: Client) {
  return getActiveEpochRow(client);
}

export function getEpochTimeRemaining(epoch: Pick<EpochRow, "week_end">) {
  const difference = Math.max(new Date(epoch.week_end).getTime() - Date.now(), 0);
  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference % 86_400_000) / 3_600_000),
    minutes: Math.floor((difference % 3_600_000) / 60_000),
    seconds: Math.floor((difference % 60_000) / 1000)
  };
}

export function calculatePrizePool(totalFees: number, operatingCosts: number) {
  void operatingCosts;
  const breakdown = calculateSettlementBreakdown(totalFees);
  return {
    total: breakdown.prizePoolSol,
    first: breakdown.prizeSplit.first,
    second: breakdown.prizeSplit.second,
    third: breakdown.prizeSplit.third
  };
}

export async function finalizeEpoch(client: Client, epochId: string) {
  const epoch = await getEpochById(client, epochId);
  if (!epoch) {
    throw new Error("Epoch not found.");
  }

  await updateEpoch(client, epochId, { status: "calculating" });
  const rankings = await listRankingsByEpoch(client, epochId);
  const grossFees = await getWeeklyFeeTotal(epoch.week_start, epoch.week_end);
  const settlement = calculateSettlementBreakdown(grossFees);
  const prizePool = calculatePrizePool(grossFees, Number(epoch.operating_costs_sol ?? 0));
  const reserveBalanceBefore = await getReserveBalance(client).catch((error) => {
    console.error("getReserveBalance failed during finalizeEpoch", error);
    return 0;
  });

  const sortedRankings = [...rankings].sort(
    (left, right) => Number(right.composite_score ?? 0) - Number(left.composite_score ?? 0)
  );
  const placements: Array<{
    agentId: string;
    rank: number;
    pnlSol: number;
    prizeSol: number;
  }> = [];

  for (const [index, ranking] of sortedRankings.entries()) {
    const prize =
      index === 0 ? prizePool.first : index === 1 ? prizePool.second : index === 2 ? prizePool.third : 0;
    const roundedPrize = Number(prize.toFixed(8));

    await upsertRanking(client, epochId, ranking.agent_id, {
      rank: index + 1,
      prize_sol: roundedPrize
    });

    placements.push({
      agentId: ranking.agent_id,
      rank: index + 1,
      pnlSol: Number(ranking.pnl_sol ?? 0),
      prizeSol: roundedPrize
    });
  }

  const completedEpoch = await updateEpoch(client, epochId, {
    total_fees_sol: settlement.grossFeesClaimedSol,
    gross_fees_claimed_sol: settlement.grossFeesClaimedSol,
    prize_pool_sol: settlement.prizePoolSol,
    operator_revenue_sol: settlement.operatorRevenueSol,
    reserve_sol: settlement.reserveSol,
    net_distributable_sol: settlement.netDistributableSol,
    reserve_balance_after_epoch: Number((reserveBalanceBefore + settlement.reserveSol).toFixed(8)),
    status: "completed"
  });

  return {
    epoch: completedEpoch,
    rankings: sortedRankings,
    placements,
    prizePool,
    settlement
  };
}

export async function createNewEpoch(client: Client) {
  const epochs = await listEpochs(client);
  const monday = getUtcMonday(new Date());
  const sunday = getUtcSundayEnd(monday);
  const existing = epochs.find(
    (epoch) => new Date(epoch.week_start).toISOString() === monday.toISOString()
  );

  if (existing) {
    return existing;
  }

  const nextEpochNumber = (epochs[0]?.epoch_number ?? 0) + 1;

  return createEpochRow(client, {
    epoch_number: nextEpochNumber,
    week_start: monday.toISOString(),
    week_end: sunday.toISOString(),
    total_fees_sol: 0,
    gross_fees_claimed_sol: 0,
    operating_costs_sol: 0,
    prize_pool_sol: 0,
    operator_revenue_sol: 0,
    reserve_sol: 0,
    net_distributable_sol: 0,
    reserve_balance_after_epoch: 0,
    status: "active"
  });
}
