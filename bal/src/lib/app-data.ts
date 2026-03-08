import type { AgentInsert } from "@/lib/supabase/types";
import { getTreasurySummary as getTreasurySummaryData } from "@/lib/settlement";
import { createServerClient } from "@/lib/supabase/server";
import {
  createAgent,
  getActiveEpoch,
  getAgentById,
  getAgentByWallet,
  getAgentTrades,
  getEpochById,
  getLeaderboard as getLeaderboardRows,
  listAgents,
  listEpochs,
  listRankingsByEpoch
} from "@/lib/supabase/queries";
import {
  mockActiveEpoch,
  mockAgents,
  mockEpochs,
  mockLeaderboard,
  mockProfiles,
  mockStats,
  mockTreasurySummary,
  mockTokens
} from "@/lib/mock-data";
import type {
  AgentProfile,
  AgentSummary,
  EpochSummary,
  LeaderboardEntry,
  TreasurySummary,
  TokenData
} from "@/types";

function avatarLabel(name: string) {
  const parts = name.split(" ").filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || name.slice(0, 2).toUpperCase();
}

function toEpochSummary(row: {
  id: string;
  epoch_number: number;
  week_start: string;
  week_end: string;
  total_fees_sol: number;
  gross_fees_claimed_sol: number;
  operating_costs_sol: number;
  prize_pool_sol: number;
  operator_revenue_sol: number;
  reserve_sol: number;
  net_distributable_sol: number;
  reserve_balance_after_epoch: number;
  status: "active" | "calculating" | "completed";
}): EpochSummary {
  return {
    id: row.id,
    epochNumber: row.epoch_number,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    totalFeesSol: Number(row.total_fees_sol ?? 0),
    grossFeesClaimedSol: Number(row.gross_fees_claimed_sol ?? 0),
    operatingCostsSol: Number(row.operating_costs_sol ?? 0),
    prizePoolSol: Number(row.prize_pool_sol ?? 0),
    operatorRevenueSol: Number(row.operator_revenue_sol ?? 0),
    reserveSol: Number(row.reserve_sol ?? 0),
    netDistributableSol: Number(row.net_distributable_sol ?? 0),
    reserveBalanceAfterEpoch: Number(row.reserve_balance_after_epoch ?? 0),
    status: row.status
  };
}

function createTrend(total: number) {
  return [0.12, 0.24, 0.41, 0.55, 0.68, 0.84, 1].map((value) =>
    Number((total * value).toFixed(2))
  );
}

function toAgentSummary(row: {
  id: string;
  name: string;
  wallet_address: string;
  avatar_url: string | null;
  registered_at: string;
  total_trades: number;
  total_pnl_sol: number;
  win_rate: number;
}): AgentSummary {
  return {
    id: row.id,
    name: row.name,
    avatarLabel: avatarLabel(row.name),
    walletAddress: row.wallet_address,
    registeredAt: row.registered_at,
    totalTrades: Number(row.total_trades ?? 0),
    totalPnlSol: Number(row.total_pnl_sol ?? 0),
    winRate: Number(row.win_rate ?? 0),
    bestEpochRank: null
  };
}

export async function getCurrentEpoch() {
  const supabase = createServerClient();
  if (!supabase) {
    return mockActiveEpoch;
  }

  try {
    const epoch = await getActiveEpoch(supabase);
    return epoch ? toEpochSummary(epoch) : mockActiveEpoch;
  } catch (error) {
    console.error("getCurrentEpoch failed", error);
    return mockActiveEpoch;
  }
}

export async function getAllEpochs() {
  const supabase = createServerClient();
  if (!supabase) {
    return mockEpochs;
  }

  try {
    const epochs = await listEpochs(supabase);
    return epochs.map(toEpochSummary);
  } catch (error) {
    console.error("getAllEpochs failed", error);
    return mockEpochs;
  }
}

export async function getLeaderboard(epochId?: string) {
  const supabase = createServerClient();
  if (!supabase) {
    return mockLeaderboard;
  }

  try {
    const epoch = epochId ? await getEpochById(supabase, epochId) : await getActiveEpoch(supabase);
    if (!epoch) {
      return mockLeaderboard;
    }

    const [rankings, agents] = await Promise.all([
      getLeaderboardRows(supabase, epoch.id),
      listAgents(supabase)
    ]);

    const agentMap = new Map(agents.map((agent) => [agent.id, agent]));

    return rankings.map((ranking, index) => {
      const agent = agentMap.get(ranking.agent_id);
      return {
        rank: ranking.rank ?? index + 1,
        agentId: ranking.agent_id,
        agentName: agent?.name ?? "Unknown Agent",
        avatarLabel: avatarLabel(agent?.name ?? "Unknown Agent"),
        walletAddress: agent?.wallet_address ?? "",
        pnlSol: Number(ranking.pnl_sol ?? 0),
        sharpeRatio: Number(ranking.sharpe_ratio ?? 0),
        maxDrawdown: Number(ranking.max_drawdown ?? 0),
        tradeEfficiency: Number(ranking.trade_efficiency ?? 0),
        compositeScore: Number(ranking.composite_score ?? 0),
        estimatedPrizeSol: Number(ranking.prize_sol ?? 0),
        trades: Number(agent?.total_trades ?? 0),
        winRate: Number(agent?.win_rate ?? 0),
        trend: createTrend(Number(ranking.pnl_sol ?? 0))
      } satisfies LeaderboardEntry;
    });
  } catch (error) {
    console.error("getLeaderboard failed", error);
    return mockLeaderboard;
  }
}

export async function getAgentSummaries() {
  const supabase = createServerClient();
  if (!supabase) {
    return mockAgents;
  }

  try {
    const [agents, activeEpoch, leaderboard] = await Promise.all([
      listAgents(supabase),
      getActiveEpoch(supabase),
      getActiveEpoch(supabase).then(async (epoch) => {
        if (!epoch) {
          return [];
        }
        return listRankingsByEpoch(supabase, epoch.id);
      })
    ]);

    const bestRankMap = new Map<string, number>();
    leaderboard.forEach((row, index) => {
      const rank = row.rank ?? index + 1;
      const existing = bestRankMap.get(row.agent_id);
      if (!existing || rank < existing) {
        bestRankMap.set(row.agent_id, rank);
      }
    });

    return agents.map((agent) => ({
      ...toAgentSummary(agent),
      bestEpochRank: bestRankMap.get(agent.id) ?? (activeEpoch ? null : null)
    }));
  } catch (error) {
    console.error("getAgentSummaries failed", error);
    return mockAgents;
  }
}

export async function getAgentProfile(agentId: string): Promise<AgentProfile | null> {
  const supabase = createServerClient();
  if (!supabase) {
    return mockProfiles.find((profile) => profile.id === agentId) ?? null;
  }

  try {
    const agent = await getAgentById(supabase, agentId);
    if (!agent) {
      return null;
    }

    const [allEpochs, rankings, trades] = await Promise.all([
      listEpochs(supabase),
      listRankingsByEpoch(supabase, (await getActiveEpoch(supabase))?.id ?? mockActiveEpoch.id),
      getAgentTrades(supabase, agentId)
    ]);

    const profileTemplate = mockProfiles.find((profile) => profile.id === agentId);

    return {
      ...toAgentSummary(agent),
      bestEpochRank:
        rankings
          .filter((ranking) => ranking.agent_id === agentId && ranking.rank !== null)
          .map((ranking) => ranking.rank as number)
          .sort((left, right) => left - right)[0] ?? null,
      epochHistory:
        profileTemplate?.epochHistory ??
        allEpochs.map((epoch) => ({
          epochId: epoch.id,
          epochNumber: epoch.epoch_number,
          rank: 0,
          pnlSol: 0,
          prizeSol: 0
        })),
      pnlHistory:
        profileTemplate?.pnlHistory ??
        createTrend(Number(agent.total_pnl_sol ?? 0)).map((value, index) => ({
          date: `T-${6 - index}`,
          pnlSol: value
        })),
      tradeHistory:
        profileTemplate?.tradeHistory ??
        trades.map((trade) => ({
          id: trade.id,
          epochId: trade.epoch_id ?? mockActiveEpoch.id,
          tokenMint: trade.token_mint,
          tokenSymbol: trade.token_symbol ?? "TOKEN",
          action: trade.action,
          amountSol: Number(trade.amount_sol ?? 0),
          tokenAmount: Number(trade.token_amount ?? 0),
          pricePerToken: Number(trade.price_per_token ?? 0),
          txSignature: trade.tx_signature,
          tradedAt: trade.traded_at,
          pnlContributionSol: 0
        }))
    };
  } catch (error) {
    console.error("getAgentProfile failed", error);
    return mockProfiles.find((profile) => profile.id === agentId) ?? null;
  }
}

export async function getTokenMarket(): Promise<TokenData[]> {
  return mockTokens;
}

export async function getTreasurySummary(): Promise<TreasurySummary> {
  const supabase = createServerClient();
  if (!supabase) {
    return mockTreasurySummary;
  }

  try {
    return await getTreasurySummaryData(supabase);
  } catch (error) {
    console.error("getTreasurySummary failed", error);
    return mockTreasurySummary;
  }
}

export async function getHomeData() {
  const [epoch, leaderboard, agents, tokens, treasury] = await Promise.all([
    getCurrentEpoch(),
    getLeaderboard(),
    getAgentSummaries(),
    getTokenMarket(),
    getTreasurySummary()
  ]);

  return {
    epoch,
    leaderboard,
    topThree: leaderboard.slice(0, 3),
    trendingAgents: agents.slice(0, 6),
    tokens: tokens.slice(0, 6),
    treasury,
    stats: mockStats
  };
}

export async function registerAgentRecord(payload: AgentInsert) {
  const supabase = createServerClient();
  if (!supabase) {
    return {
      id: `mock-${payload.wallet_address}`,
      name: payload.name,
      avatar_url: payload.avatar_url ?? null,
      wallet_address: payload.wallet_address,
      registered_at: new Date().toISOString(),
      total_trades: 0,
      total_pnl_sol: 0,
      win_rate: 0
    };
  }

  const existing = await getAgentByWallet(supabase, payload.wallet_address);
  if (existing) {
    throw new Error("Agent with this wallet already exists.");
  }

  return createAgent(supabase, payload);
}
