import { clamp } from "@/lib/utils";
import type { TradeRow } from "@/lib/supabase/types";
import type { PositionSnapshot } from "@/types";

interface PositionAccumulator {
  tokenMint: string;
  tokenSymbol: string;
  amount: number;
  avgBuyPrice: number;
}

export interface AgentPnLResult {
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positions: PositionSnapshot[];
  sharpeRatio: number;
  maxDrawdown: number;
  tradeEfficiency: number;
  compositeScore: number;
  winRate: number;
  closedTrades: number;
}

function normalizeTokenAmount(trade: TradeRow) {
  return Number(trade.token_amount ?? 0);
}

function normalizePrice(trade: TradeRow) {
  const explicit = Number(trade.price_per_token ?? 0);
  if (explicit > 0) {
    return explicit;
  }

  const tokenAmount = normalizeTokenAmount(trade);
  if (tokenAmount <= 0) {
    return 0;
  }

  return Number(trade.amount_sol ?? 0) / tokenAmount;
}

function computeSharpeRatio(returns: number[]) {
  if (returns.length < 2) {
    return returns.length === 1 ? returns[0] : 0;
  }

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1 || 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return mean === 0 ? 0 : mean > 0 ? 3 : -3;
  }

  return (mean / stdDev) * Math.sqrt(7);
}

function computeMaxDrawdown(cumulativeSeries: number[]) {
  let peak = 0;
  let maxDrawdown = 0;

  cumulativeSeries.forEach((value) => {
    peak = Math.max(peak, value);
    if (peak <= 0) {
      return;
    }

    const drawdown = ((value - peak) / peak) * 100;
    maxDrawdown = Math.min(maxDrawdown, drawdown);
  });

  return maxDrawdown;
}

export function calculateAgentPnL(trades: TradeRow[], currentPrices: Record<string, number>): AgentPnLResult {
  const sortedTrades = [...trades].sort(
    (left, right) => new Date(left.traded_at).getTime() - new Date(right.traded_at).getTime()
  );

  const positions = new Map<string, PositionAccumulator>();
  const realizedEvents: number[] = [];
  const cumulativeSeries: number[] = [];
  let realizedPnl = 0;

  sortedTrades.forEach((trade) => {
    const tokenMint = trade.token_mint;
    const tokenSymbol = trade.token_symbol ?? "TOKEN";
    const tokenAmount = normalizeTokenAmount(trade);
    const pricePerToken = normalizePrice(trade);

    const position = positions.get(tokenMint) ?? {
      tokenMint,
      tokenSymbol,
      amount: 0,
      avgBuyPrice: 0
    };

    if (trade.action === "buy") {
      const nextAmount = position.amount + tokenAmount;
      const totalCost = position.amount * position.avgBuyPrice + tokenAmount * pricePerToken;
      position.amount = nextAmount;
      position.avgBuyPrice = nextAmount > 0 ? totalCost / nextAmount : 0;
      positions.set(tokenMint, position);
      realizedEvents.push(0);
    } else {
      const sellAmount = Math.min(tokenAmount, position.amount || tokenAmount);
      const realized = (pricePerToken - position.avgBuyPrice) * sellAmount;
      realizedPnl += realized;
      position.amount = Math.max(0, position.amount - sellAmount);
      if (position.amount === 0) {
        position.avgBuyPrice = 0;
      }
      positions.set(tokenMint, position);
      realizedEvents.push(realized);
    }

    cumulativeSeries.push(realizedPnl);
  });

  const snapshots: PositionSnapshot[] = [...positions.values()]
    .filter((position) => position.amount > 0)
    .map((position) => {
      const currentPrice = currentPrices[position.tokenMint] ?? position.avgBuyPrice;
      const unrealized = (currentPrice - position.avgBuyPrice) * position.amount;
      return {
        tokenMint: position.tokenMint,
        tokenSymbol: position.tokenSymbol,
        amount: Number(position.amount.toFixed(8)),
        avgBuyPrice: Number(position.avgBuyPrice.toFixed(12)),
        currentPrice: Number(currentPrice.toFixed(12)),
        unrealizedPnlSol: Number(unrealized.toFixed(8))
      };
    });

  const unrealizedPnl = snapshots.reduce((sum, position) => sum + position.unrealizedPnlSol, 0);
  const wins = realizedEvents.filter((value) => value > 0);
  const losses = realizedEvents.filter((value) => value < 0);
  const avgWin = wins.length ? wins.reduce((sum, value) => sum + value, 0) / wins.length : 0;
  const avgLoss = losses.length
    ? Math.abs(losses.reduce((sum, value) => sum + value, 0) / losses.length)
    : 1;
  const winRate = realizedEvents.length ? wins.length / realizedEvents.length : 0;
  const tradeEfficiency = winRate * (avgWin / avgLoss);
  const sharpeRatio = computeSharpeRatio(realizedEvents);
  const maxDrawdown = computeMaxDrawdown(cumulativeSeries);
  const totalPnl = realizedPnl + unrealizedPnl;

  const pnlNormalized = clamp(50 + totalPnl * 10, 0, 100);
  const sharpeNormalized = clamp((sharpeRatio + 1) * 20, 0, 100);
  const drawdownNormalized = clamp(100 - Math.abs(maxDrawdown) * 2, 0, 100);
  const efficiencyNormalized = clamp(tradeEfficiency * 40, 0, 100);

  const compositeScore =
    pnlNormalized * 0.4 +
    sharpeNormalized * 0.25 +
    drawdownNormalized * 0.2 +
    efficiencyNormalized * 0.15;

  return {
    totalPnl: Number(totalPnl.toFixed(8)),
    realizedPnl: Number(realizedPnl.toFixed(8)),
    unrealizedPnl: Number(unrealizedPnl.toFixed(8)),
    positions: snapshots,
    sharpeRatio: Number(sharpeRatio.toFixed(4)),
    maxDrawdown: Number(maxDrawdown.toFixed(4)),
    tradeEfficiency: Number(tradeEfficiency.toFixed(4)),
    compositeScore: Number(compositeScore.toFixed(4)),
    winRate: Number((winRate * 100).toFixed(2)),
    closedTrades: wins.length + losses.length
  };
}
