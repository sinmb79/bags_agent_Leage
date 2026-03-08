import type { SupabaseClient } from "@supabase/supabase-js";
import { getWeeklyFeeTotal } from "@/lib/bags/partner";
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
  const total = Math.max(totalFees - operatingCosts, 0);
  return {
    total,
    first: total * 0.5,
    second: total * 0.3,
    third: total * 0.2
  };
}

export async function finalizeEpoch(client: Client, epochId: string) {
  const epoch = await getEpochById(client, epochId);
  if (!epoch) {
    throw new Error("Epoch not found.");
  }

  await updateEpoch(client, epochId, { status: "calculating" });
  const rankings = await listRankingsByEpoch(client, epochId);
  const totalFees = await getWeeklyFeeTotal(epoch.week_start, epoch.week_end);
  const prizePool = calculatePrizePool(totalFees, Number(epoch.operating_costs_sol ?? 0));

  const sortedRankings = [...rankings].sort(
    (left, right) => Number(right.composite_score ?? 0) - Number(left.composite_score ?? 0)
  );

  for (const [index, ranking] of sortedRankings.entries()) {
    const prize =
      index === 0 ? prizePool.first : index === 1 ? prizePool.second : index === 2 ? prizePool.third : 0;

    await upsertRanking(client, epochId, ranking.agent_id, {
      rank: index + 1,
      prize_sol: Number(prize.toFixed(8))
    });
  }

  await updateEpoch(client, epochId, {
    total_fees_sol: Number(totalFees.toFixed(8)),
    prize_pool_sol: Number(prizePool.total.toFixed(8)),
    status: "completed"
  });

  return {
    rankings: sortedRankings,
    prizePool
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
    operating_costs_sol: 0,
    prize_pool_sol: 0,
    status: "active"
  });
}
