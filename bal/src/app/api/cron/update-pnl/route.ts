import { getTokenPrices } from "@/lib/prices";
import { calculateAgentPnL } from "@/lib/pnl";
import { errorResponse, successResponse } from "@/lib/response";
import { createServerClient } from "@/lib/supabase/server";
import {
  getActiveEpoch,
  listAgents,
  listTradesByEpoch,
  replacePositionsForAgent,
  updateAgent,
  upsertRanking
} from "@/lib/supabase/queries";

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
    if (!activeEpoch) {
      return successResponse({ agentsUpdated: 0, message: "No active epoch." });
    }

    const [agents, trades] = await Promise.all([
      listAgents(supabase),
      listTradesByEpoch(supabase, activeEpoch.id)
    ]);

    const currentPrices = await getTokenPrices(trades.map((trade) => trade.token_mint));
    const results: Array<{ agentId: string; compositeScore: number }> = [];

    for (const agent of agents) {
      const agentTrades = trades.filter((trade) => trade.agent_id === agent.id);
      const pnl = calculateAgentPnL(agentTrades, currentPrices);

      await replacePositionsForAgent(
        supabase,
        agent.id,
        pnl.positions.map((position) => ({
          agent_id: agent.id,
          token_mint: position.tokenMint,
          token_symbol: position.tokenSymbol,
          amount: position.amount,
          avg_buy_price: position.avgBuyPrice,
          current_price: position.currentPrice,
          unrealized_pnl_sol: position.unrealizedPnlSol
        }))
      );

      await upsertRanking(supabase, activeEpoch.id, agent.id, {
        pnl_sol: pnl.totalPnl,
        sharpe_ratio: pnl.sharpeRatio,
        max_drawdown: pnl.maxDrawdown,
        trade_efficiency: pnl.tradeEfficiency,
        composite_score: pnl.compositeScore
      });

      await updateAgent(supabase, agent.id, {
        total_trades: agentTrades.length,
        total_pnl_sol: pnl.totalPnl,
        win_rate: pnl.winRate
      });

      results.push({ agentId: agent.id, compositeScore: pnl.compositeScore });
    }

    const ranked = [...results].sort((left, right) => right.compositeScore - left.compositeScore);
    for (const [index, item] of ranked.entries()) {
      await upsertRanking(supabase, activeEpoch.id, item.agentId, {
        rank: index + 1
      });
    }

    return successResponse({ agentsUpdated: agents.length });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to update PnL.");
  }
}

