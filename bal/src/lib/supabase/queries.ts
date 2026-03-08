import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentInsert,
  AgentRow,
  AgentUpdate,
  EpochInsert,
  EpochRow,
  EpochUpdate,
  PayoutBatchInsert,
  PayoutBatchRow,
  PayoutBatchUpdate,
  PayoutItemInsert,
  PayoutItemRow,
  PayoutItemUpdate,
  PositionInsert,
  PositionUpdate,
  RankingRow,
  TelegramFeedbackInsert,
  TelegramFeedbackRow,
  TelegramFeedbackUpdate,
  TelegramUserStateInsert,
  TelegramUserStateRow,
  TelegramUserStateUpdate,
  TreasuryLedgerInsert,
  TreasuryLedgerRow,
  TradeInsert,
  TradeRow
} from "@/lib/supabase/types";
import type { PayoutBatchStatus, TelegramFeedbackStatus, TreasuryLedgerEntryType } from "@/types";

type Client = SupabaseClient;

const AGENT_COLUMNS =
  "id,name,avatar_url,wallet_address,registered_at,total_trades,total_pnl_sol,win_rate";
const EPOCH_COLUMNS =
  "id,epoch_number,week_start,week_end,total_fees_sol,gross_fees_claimed_sol,operating_costs_sol,prize_pool_sol,operator_revenue_sol,reserve_sol,net_distributable_sol,reserve_balance_after_epoch,status,created_at";
const TRADE_COLUMNS =
  "id,agent_id,epoch_id,token_mint,token_symbol,action,amount_sol,token_amount,price_per_token,tx_signature,traded_at,detected_at";
const RANKING_COLUMNS =
  "id,epoch_id,agent_id,rank,pnl_sol,sharpe_ratio,max_drawdown,trade_efficiency,composite_score,prize_sol,prize_tx_signature";
const POSITION_COLUMNS =
  "id,agent_id,token_mint,token_symbol,amount,avg_buy_price,current_price,unrealized_pnl_sol,updated_at";
const PAYOUT_BATCH_COLUMNS =
  "id,epoch_id,status,treasury_wallet_address,operator_wallet_address,scheduled_for,gross_fees_claimed_sol,prize_pool_sol,operator_revenue_sol,reserve_sol,net_distributable_sol,reserve_balance_after_epoch,admin_message_id,approval_requested_at,approved_at,approved_by_telegram_user_id,approved_by_telegram_username,executed_at,failure_reason,created_at,updated_at";
const PAYOUT_ITEM_COLUMNS =
  "id,payout_batch_id,epoch_id,ranking_id,agent_id,item_key,item_type,rank,recipient_wallet_address,recipient_name,amount_sol,status,tx_signature,attempt_count,last_error,created_at,updated_at";
const TREASURY_LEDGER_COLUMNS =
  "id,epoch_id,payout_batch_id,payout_item_id,entry_type,amount_sol,wallet_address,tx_signature,note,created_at";
const TELEGRAM_FEEDBACK_COLUMNS =
  "id,telegram_user_id,telegram_username,telegram_chat_id,source,category,message,agent_name,wallet_address,linked_agent_id,status,admin_message_id,created_at,updated_at";
const TELEGRAM_STATE_COLUMNS = "telegram_user_id,telegram_chat_id,state,draft_category,updated_at";

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

export async function getAgentByName(client: Client, agentName: string): Promise<AgentRow | null> {
  const { data, error } = await client
    .from("agents")
    .select(AGENT_COLUMNS)
    .ilike("name", agentName)
    .order("registered_at", { ascending: true })
    .limit(1)
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

export async function getPayoutBatchById(client: Client, payoutBatchId: string): Promise<PayoutBatchRow | null> {
  const { data, error } = await client
    .from("payout_batches")
    .select(PAYOUT_BATCH_COLUMNS)
    .eq("id", payoutBatchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as PayoutBatchRow | null;
}

export async function getPayoutBatchByEpochId(client: Client, epochId: string): Promise<PayoutBatchRow | null> {
  const { data, error } = await client
    .from("payout_batches")
    .select(PAYOUT_BATCH_COLUMNS)
    .eq("epoch_id", epochId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as PayoutBatchRow | null;
}

export async function getLatestPayoutBatch(client: Client): Promise<PayoutBatchRow | null> {
  const { data, error } = await client
    .from("payout_batches")
    .select(PAYOUT_BATCH_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as PayoutBatchRow | null;
}

export async function createPayoutBatch(client: Client, payload: PayoutBatchInsert): Promise<PayoutBatchRow> {
  const { data, error } = await client
    .from("payout_batches")
    .insert(payload)
    .select(PAYOUT_BATCH_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as PayoutBatchRow;
}

export async function updatePayoutBatch(
  client: Client,
  payoutBatchId: string,
  payload: PayoutBatchUpdate
): Promise<PayoutBatchRow> {
  const { data, error } = await client
    .from("payout_batches")
    .update(payload)
    .eq("id", payoutBatchId)
    .select(PAYOUT_BATCH_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as PayoutBatchRow;
}

export async function listApprovalPendingPayoutBatches(
  client: Client,
  scheduledBefore: string
): Promise<PayoutBatchRow[]> {
  const { data, error } = await client
    .from("payout_batches")
    .select(PAYOUT_BATCH_COLUMNS)
    .in("status", ["pending_approval", "held"] satisfies PayoutBatchStatus[])
    .lte("scheduled_for", scheduledBefore)
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as PayoutBatchRow[];
}

export async function listRunnablePayoutBatches(
  client: Client,
  scheduledBefore: string
): Promise<PayoutBatchRow[]> {
  const { data, error } = await client
    .from("payout_batches")
    .select(PAYOUT_BATCH_COLUMNS)
    .in("status", ["approved", "executing", "partial_failure"] satisfies PayoutBatchStatus[])
    .lte("scheduled_for", scheduledBefore)
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as PayoutBatchRow[];
}

export async function insertPayoutItems(client: Client, payload: PayoutItemInsert[]): Promise<PayoutItemRow[]> {
  if (!payload.length) {
    return [];
  }

  const { data, error } = await client
    .from("payout_items")
    .insert(payload)
    .select(PAYOUT_ITEM_COLUMNS);

  if (error) {
    throw error;
  }

  return (data ?? []) as PayoutItemRow[];
}

export async function listPayoutItemsByBatch(client: Client, payoutBatchId: string): Promise<PayoutItemRow[]> {
  const { data, error } = await client
    .from("payout_items")
    .select(PAYOUT_ITEM_COLUMNS)
    .eq("payout_batch_id", payoutBatchId)
    .order("item_type", { ascending: true })
    .order("rank", { ascending: true, nullsFirst: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as PayoutItemRow[];
}

export async function updatePayoutItem(
  client: Client,
  payoutItemId: string,
  payload: PayoutItemUpdate
): Promise<PayoutItemRow> {
  const { data, error } = await client
    .from("payout_items")
    .update(payload)
    .eq("id", payoutItemId)
    .select(PAYOUT_ITEM_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as PayoutItemRow;
}

export async function cancelPendingPayoutItems(client: Client, payoutBatchId: string): Promise<PayoutItemRow[]> {
  const { data, error } = await client
    .from("payout_items")
    .update({ status: "cancelled" })
    .eq("payout_batch_id", payoutBatchId)
    .in("status", ["pending", "failed", "processing"])
    .select(PAYOUT_ITEM_COLUMNS);

  if (error) {
    throw error;
  }

  return (data ?? []) as PayoutItemRow[];
}

export async function insertTreasuryLedgerEntries(
  client: Client,
  payload: TreasuryLedgerInsert[]
): Promise<TreasuryLedgerRow[]> {
  if (!payload.length) {
    return [];
  }

  const { data, error } = await client
    .from("treasury_ledger")
    .insert(payload)
    .select(TREASURY_LEDGER_COLUMNS);

  if (error) {
    throw error;
  }

  return (data ?? []) as TreasuryLedgerRow[];
}

export async function listTreasuryLedgerByType(
  client: Client,
  entryType: TreasuryLedgerEntryType,
  payoutBatchId?: string
): Promise<TreasuryLedgerRow[]> {
  let query = client
    .from("treasury_ledger")
    .select(TREASURY_LEDGER_COLUMNS)
    .eq("entry_type", entryType)
    .order("created_at", { ascending: false });

  if (payoutBatchId) {
    query = query.eq("payout_batch_id", payoutBatchId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []) as TreasuryLedgerRow[];
}

export async function getTelegramFeedbackById(
  client: Client,
  feedbackId: string
): Promise<TelegramFeedbackRow | null> {
  const { data, error } = await client
    .from("telegram_feedback")
    .select(TELEGRAM_FEEDBACK_COLUMNS)
    .eq("id", feedbackId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as TelegramFeedbackRow | null;
}

export async function createTelegramFeedback(
  client: Client,
  payload: TelegramFeedbackInsert
): Promise<TelegramFeedbackRow> {
  const { data, error } = await client
    .from("telegram_feedback")
    .insert(payload)
    .select(TELEGRAM_FEEDBACK_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as TelegramFeedbackRow;
}

export async function updateTelegramFeedback(
  client: Client,
  feedbackId: string,
  payload: TelegramFeedbackUpdate
): Promise<TelegramFeedbackRow> {
  const { data, error } = await client
    .from("telegram_feedback")
    .update(payload)
    .eq("id", feedbackId)
    .select(TELEGRAM_FEEDBACK_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as TelegramFeedbackRow;
}

export async function updateTelegramFeedbackStatus(
  client: Client,
  feedbackId: string,
  status: TelegramFeedbackStatus
): Promise<TelegramFeedbackRow> {
  return updateTelegramFeedback(client, feedbackId, { status });
}

export async function getTelegramUserState(
  client: Client,
  telegramUserId: string
): Promise<TelegramUserStateRow | null> {
  const { data, error } = await client
    .from("telegram_user_state")
    .select(TELEGRAM_STATE_COLUMNS)
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as TelegramUserStateRow | null;
}

export async function upsertTelegramUserState(
  client: Client,
  payload: TelegramUserStateInsert | (TelegramUserStateInsert & TelegramUserStateUpdate)
): Promise<TelegramUserStateRow> {
  const { data, error } = await client
    .from("telegram_user_state")
    .upsert(payload, { onConflict: "telegram_user_id" })
    .select(TELEGRAM_STATE_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data as TelegramUserStateRow;
}

export async function clearTelegramUserState(
  client: Client,
  telegramUserId: string,
  telegramChatId: string
): Promise<TelegramUserStateRow> {
  return upsertTelegramUserState(client, {
    telegram_user_id: telegramUserId,
    telegram_chat_id: telegramChatId,
    state: "idle",
    draft_category: null
  });
}

export async function matchAgentByWalletOrName(
  client: Client,
  input: { walletAddress?: string | null; agentName?: string | null }
): Promise<AgentRow | null> {
  const walletAddress = input.walletAddress?.trim();
  if (walletAddress) {
    const byWallet = await getAgentByWallet(client, walletAddress);
    if (byWallet) {
      return byWallet;
    }
  }

  const agentName = input.agentName?.trim();
  if (!agentName) {
    return null;
  }

  return getAgentByName(client, agentName);
}

export type QueryRows = {
  AgentRow: AgentRow;
  EpochRow: EpochRow;
  PayoutBatchRow: PayoutBatchRow;
  PayoutItemRow: PayoutItemRow;
  RankingRow: RankingRow;
  TelegramFeedbackRow: TelegramFeedbackRow;
  TelegramUserStateRow: TelegramUserStateRow;
  TreasuryLedgerRow: TreasuryLedgerRow;
  TradeRow: TradeRow;
};
