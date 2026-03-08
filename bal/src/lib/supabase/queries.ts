import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentInsert,
  AgentRow,
  AgentUpdate,
  EpochInsert,
  EpochRow,
  EpochUpdate,
  PositionInsert,
  PositionUpdate,
  RankingRow,
  TradeInsert,
  TradeRow
} from "@/lib/supabase/types";

type Client = SupabaseClient;

const AGENT_COLUMNS =
  "id,name,avatar_url,wallet_address,registered_at,total_trades,total_pnl_sol,win_rate";
const EPOCH_COLUMNS =
  "id,epoch_number,week_start,week_end,total_fees_sol,operating_costs_sol,prize_pool_sol,status,created_at";
const TRADE_COLUMNS =
  "id,agent_id,epoch_id,token_mint,token_symbol,action,amount_sol,token_amount,price_per_token,tx_signature,traded_at,detected_at";
const RANKING_COLUMNS =
  "id,epoch_id,agent_id,rank,pnl_sol,sharpe_ratio,max_drawdown,trade_efficiency,composite_score,prize_sol,prize_tx_signature";
const POSITION_COLUMNS =
  "id,agent_id,token_mint,token_symbol,amount,avg_buy_price,current_price,unrealized_pnl_sol,updated_at";

export async function getActiveEpoch(client: Client): Promise<EpochRow | null> {
  const { data, error } = await client
    .from("epochs")
    .select(EPOCH_COLUMNS)
    .eq("status", "active")
    .order("epoch_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as EpochRow | null;
}

export async function getEpochById(client: Client, epochId: string): Promise<EpochRow | null> {
  const { data, error } = await client
    .from("epochs")
    .select(EPOCH_COLUMNS)
    .eq("id", epochId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as EpochRow | null;
}

export async function listEpochs(client: Client): Promise<EpochRow[]> {
  const { data, error } = await client
    .from("epochs")
    .select(EPOCH_COLUMNS)
    .order("epoch_number", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as EpochRow[];
}

export async function listAgents(client: Client): Promise<AgentRow[]> {
  const { data, error } = await client
    .from("agents")
    .select(AGENT_COLUMNS)
    .order("total_pnl_sol", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AgentRow[];
}

export async function getAgentByWallet(client: Client, walletAddress: string): Promise<AgentRow | null> {
  const { data, error } = await client
    .from("agents")
    .select(AGENT_COLUMNS)
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as AgentRow | null;
}

export async function getAgentById(client: Client, agentId: string): Promise<AgentRow | null> {
  const { data, error } = await client
    .from("agents")
    .select(AGENT_COLUMNS)
    .eq("id", agentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as AgentRow | null;
}

export async function createAgent(client: Client, payload: AgentInsert): Promise<AgentRow> {
  const { data, error } = await client
    .from("agents")
    .insert(payload)
    .select(AGENT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as AgentRow;
}

export async function updateAgent(client: Client, agentId: string, payload: AgentUpdate): Promise<AgentRow> {
  const { data, error } = await client
    .from("agents")
    .update(payload)
    .eq("id", agentId)
    .select(AGENT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as AgentRow;
}

export async function getLeaderboard(client: Client, epochId: string): Promise<RankingRow[]> {
  const { data, error } = await client
    .from("rankings")
    .select(RANKING_COLUMNS)
    .eq("epoch_id", epochId)
    .order("composite_score", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RankingRow[];
}

export async function getAgentTrades(
  client: Client,
  agentId: string,
  epochId?: string | null
): Promise<TradeRow[]> {
  let query = client
    .from("trades")
    .select(TRADE_COLUMNS)
    .eq("agent_id", agentId)
    .order("traded_at", { ascending: true });

  if (epochId) {
    query = query.eq("epoch_id", epochId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []) as TradeRow[];
}

export async function listTradesByEpoch(client: Client, epochId: string): Promise<TradeRow[]> {
  const { data, error } = await client
    .from("trades")
    .select(TRADE_COLUMNS)
    .eq("epoch_id", epochId)
    .order("traded_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as TradeRow[];
}

export async function getExistingTradeSignatures(client: Client, signatures: string[]): Promise<string[]> {
  if (!signatures.length) {
    return [];
  }

  const { data, error } = await client
    .from("trades")
    .select("tx_signature")
    .in("tx_signature", signatures);

  if (error) {
    throw error;
  }

  return (data ?? []).map((trade) => trade.tx_signature);
}

export async function insertTrades(client: Client, payload: TradeInsert[]) {
  if (!payload.length) {
    return [];
  }

  const { data, error } = await client
    .from("trades")
    .insert(payload)
    .select(TRADE_COLUMNS);

  if (error) {
    throw error;
  }

  return (data ?? []) as TradeRow[];
}

export async function upsertRanking(
  client: Client,
  epochId: string,
  agentId: string,
  payload: Partial<Omit<RankingRow, "id" | "epoch_id" | "agent_id">>
): Promise<RankingRow> {
  const { data, error } = await client
    .from("rankings")
    .upsert(
      {
        epoch_id: epochId,
        agent_id: agentId,
        ...payload
      },
      { onConflict: "epoch_id,agent_id" }
    )
    .select(RANKING_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as RankingRow;
}

export async function listRankingsByEpoch(client: Client, epochId: string): Promise<RankingRow[]> {
  const { data, error } = await client
    .from("rankings")
    .select(RANKING_COLUMNS)
    .eq("epoch_id", epochId)
    .order("composite_score", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RankingRow[];
}

export async function upsertPosition(
  client: Client,
  payload: PositionInsert | (PositionInsert & PositionUpdate)
) {
  const { data, error } = await client
    .from("positions")
    .upsert(payload, { onConflict: "agent_id,token_mint" })
    .select(POSITION_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function replacePositionsForAgent(
  client: Client,
  agentId: string,
  positions: PositionInsert[]
) {
  const { error: deleteError } = await client.from("positions").delete().eq("agent_id", agentId);
  if (deleteError) {
    throw deleteError;
  }

  if (!positions.length) {
    return [];
  }

  const { data, error } = await client
    .from("positions")
    .insert(positions)
    .select(POSITION_COLUMNS);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createEpoch(client: Client, payload: EpochInsert): Promise<EpochRow> {
  const { data, error } = await client
    .from("epochs")
    .insert(payload)
    .select(EPOCH_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as EpochRow;
}

export async function updateEpoch(client: Client, epochId: string, payload: EpochUpdate): Promise<EpochRow> {
  const { data, error } = await client
    .from("epochs")
    .update(payload)
    .eq("id", epochId)
    .select(EPOCH_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as EpochRow;
}

export async function listPendingPrizeDistribution(client: Client): Promise<RankingRow[]> {
  const { data, error } = await client
    .from("rankings")
    .select(RANKING_COLUMNS)
    .gt("prize_sol", 0)
    .is("prize_tx_signature", null)
    .order("prize_sol", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RankingRow[];
}

export type QueryRows = {
  AgentRow: AgentRow;
  EpochRow: EpochRow;
  RankingRow: RankingRow;
  TradeRow: TradeRow;
};
