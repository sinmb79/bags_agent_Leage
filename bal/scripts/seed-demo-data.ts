import { createClient } from "@supabase/supabase-js";
import { mockActiveEpoch, mockAgents, mockLeaderboard, mockProfiles } from "../src/lib/mock-data";
import type { Database } from "../src/lib/supabase/types";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const supabase = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  await supabase.from("epochs").upsert(
    [
      {
        id: "epoch-completed-2026-02-24",
        epoch_number: 2,
        week_start: "2026-02-24T00:00:00.000Z",
        week_end: "2026-03-01T23:59:59.000Z",
        total_fees_sol: 11.14,
        operating_costs_sol: 1.1,
        prize_pool_sol: 10.04,
        status: "completed"
      },
      {
        id: mockActiveEpoch.id,
        epoch_number: mockActiveEpoch.epochNumber,
        week_start: mockActiveEpoch.weekStart,
        week_end: mockActiveEpoch.weekEnd,
        total_fees_sol: mockActiveEpoch.totalFeesSol,
        operating_costs_sol: mockActiveEpoch.operatingCostsSol,
        prize_pool_sol: mockActiveEpoch.prizePoolSol,
        status: mockActiveEpoch.status
      }
    ],
    { onConflict: "epoch_number" }
  );

  await supabase.from("agents").upsert(
    mockAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      avatar_url: null,
      wallet_address: agent.walletAddress,
      registered_at: agent.registeredAt,
      total_trades: agent.totalTrades,
      total_pnl_sol: agent.totalPnlSol,
      win_rate: agent.winRate
    })),
    { onConflict: "wallet_address" }
  );

  await supabase.from("rankings").upsert(
    mockLeaderboard.map((entry) => ({
      epoch_id: mockActiveEpoch.id,
      agent_id: entry.agentId,
      rank: entry.rank,
      pnl_sol: entry.pnlSol,
      sharpe_ratio: entry.sharpeRatio,
      max_drawdown: entry.maxDrawdown,
      trade_efficiency: entry.tradeEfficiency,
      composite_score: entry.compositeScore,
      prize_sol: entry.estimatedPrizeSol,
      prize_tx_signature: null
    })),
    { onConflict: "epoch_id,agent_id" }
  );

  const tradeRows = mockProfiles.flatMap((profile) =>
    profile.tradeHistory.map((trade) => ({
      id: trade.id,
      agent_id: profile.id,
      epoch_id: trade.epochId,
      token_mint: trade.tokenMint,
      token_symbol: trade.tokenSymbol,
      action: trade.action,
      amount_sol: trade.amountSol,
      token_amount: trade.tokenAmount,
      price_per_token: trade.pricePerToken,
      tx_signature: trade.txSignature,
      traded_at: trade.tradedAt
    }))
  );

  await supabase.from("trades").upsert(tradeRows, { onConflict: "tx_signature" });
  console.log("Seeded demo data.");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

