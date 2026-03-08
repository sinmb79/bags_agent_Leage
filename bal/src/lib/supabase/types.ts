import type {
  PayoutBatchStatus,
  PayoutItemStatus,
  PayoutItemType,
  TelegramBotState,
  TelegramFeedbackCategory,
  TelegramFeedbackSource,
  TelegramFeedbackStatus,
  TreasuryLedgerEntryType
} from "@/types";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface AgentRow {
  id: string;
  name: string;
  avatar_url: string | null;
  wallet_address: string;
  registered_at: string;
  total_trades: number;
  total_pnl_sol: number;
  win_rate: number;
}

export type AgentInsert = Omit<
  AgentRow,
  "id" | "registered_at" | "total_trades" | "total_pnl_sol" | "win_rate"
> & {
  avatar_url?: string | null;
};

export type AgentUpdate = Partial<Omit<AgentRow, "id">>;

export interface EpochRow {
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
  created_at: string;
}

export type EpochInsert = Omit<EpochRow, "id" | "created_at">;
export type EpochUpdate = Partial<Omit<EpochRow, "id" | "created_at">>;

export interface TradeRow {
  id: string;
  agent_id: string;
  epoch_id: string | null;
  token_mint: string;
  token_symbol: string | null;
  action: "buy" | "sell";
  amount_sol: number;
  token_amount: number | null;
  price_per_token: number | null;
  tx_signature: string;
  traded_at: string;
  detected_at: string;
}

export type TradeInsert = Omit<TradeRow, "id" | "detected_at">;
export type TradeUpdate = Partial<Omit<TradeRow, "id" | "detected_at">>;

export interface RankingRow {
  id: string;
  epoch_id: string;
  agent_id: string;
  rank: number | null;
  pnl_sol: number;
  sharpe_ratio: number;
  max_drawdown: number;
  trade_efficiency: number;
  composite_score: number;
  prize_sol: number;
  prize_tx_signature: string | null;
}

export type RankingInsert = Omit<RankingRow, "id">;
export type RankingUpdate = Partial<Omit<RankingRow, "id" | "epoch_id" | "agent_id">>;

export interface PositionRow {
  id: string;
  agent_id: string;
  token_mint: string;
  token_symbol: string | null;
  amount: number;
  avg_buy_price: number;
  current_price: number;
  unrealized_pnl_sol: number;
  updated_at: string;
}

export type PositionInsert = Omit<PositionRow, "id" | "updated_at">;
export type PositionUpdate = Partial<Omit<PositionRow, "id" | "agent_id" | "token_mint" | "updated_at">>;

export interface TelegramFeedbackRow {
  id: string;
  telegram_user_id: string;
  telegram_username: string | null;
  telegram_chat_id: string;
  source: TelegramFeedbackSource;
  category: TelegramFeedbackCategory;
  message: string;
  agent_name: string | null;
  wallet_address: string | null;
  linked_agent_id: string | null;
  status: TelegramFeedbackStatus;
  admin_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TelegramFeedbackInsert = Omit<
  TelegramFeedbackRow,
  "id" | "status" | "admin_message_id" | "created_at" | "updated_at"
> & {
  status?: TelegramFeedbackStatus;
  admin_message_id?: string | null;
};

export type TelegramFeedbackUpdate = Partial<
  Omit<TelegramFeedbackRow, "id" | "telegram_user_id" | "telegram_chat_id" | "created_at">
>;

export interface TelegramUserStateRow {
  telegram_user_id: string;
  telegram_chat_id: string;
  state: TelegramBotState;
  draft_category: string | null;
  updated_at: string;
}

export type TelegramUserStateInsert = Omit<TelegramUserStateRow, "updated_at">;
export type TelegramUserStateUpdate = Partial<Omit<TelegramUserStateRow, "telegram_user_id" | "updated_at">>;

export interface PayoutBatchRow {
  id: string;
  epoch_id: string;
  status: PayoutBatchStatus;
  treasury_wallet_address: string;
  operator_wallet_address: string;
  scheduled_for: string;
  gross_fees_claimed_sol: number;
  prize_pool_sol: number;
  operator_revenue_sol: number;
  reserve_sol: number;
  net_distributable_sol: number;
  reserve_balance_after_epoch: number;
  admin_message_id: string | null;
  approval_requested_at: string;
  approved_at: string | null;
  approved_by_telegram_user_id: string | null;
  approved_by_telegram_username: string | null;
  executed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type PayoutBatchInsert = Omit<
  PayoutBatchRow,
  "id" | "admin_message_id" | "approved_at" | "approved_by_telegram_user_id" | "approved_by_telegram_username" | "executed_at" | "failure_reason" | "created_at" | "updated_at"
> & {
  admin_message_id?: string | null;
  approved_at?: string | null;
  approved_by_telegram_user_id?: string | null;
  approved_by_telegram_username?: string | null;
  executed_at?: string | null;
  failure_reason?: string | null;
};

export type PayoutBatchUpdate = Partial<
  Omit<PayoutBatchRow, "id" | "epoch_id" | "treasury_wallet_address" | "operator_wallet_address" | "approval_requested_at" | "created_at">
>;

export interface PayoutItemRow {
  id: string;
  payout_batch_id: string;
  epoch_id: string;
  ranking_id: string | null;
  agent_id: string | null;
  item_key: string;
  item_type: PayoutItemType;
  rank: number | null;
  recipient_wallet_address: string;
  recipient_name: string;
  amount_sol: number;
  status: PayoutItemStatus;
  tx_signature: string | null;
  attempt_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export type PayoutItemInsert = Omit<
  PayoutItemRow,
  "id" | "status" | "tx_signature" | "attempt_count" | "last_error" | "created_at" | "updated_at"
> & {
  status?: PayoutItemStatus;
  tx_signature?: string | null;
  attempt_count?: number;
  last_error?: string | null;
};

export type PayoutItemUpdate = Partial<
  Omit<PayoutItemRow, "id" | "payout_batch_id" | "epoch_id" | "item_key" | "item_type" | "recipient_wallet_address" | "recipient_name" | "created_at">
>;

export interface TreasuryLedgerRow {
  id: string;
  epoch_id: string | null;
  payout_batch_id: string | null;
  payout_item_id: string | null;
  entry_type: TreasuryLedgerEntryType;
  amount_sol: number;
  wallet_address: string;
  tx_signature: string | null;
  note: string | null;
  created_at: string;
}

export type TreasuryLedgerInsert = Omit<TreasuryLedgerRow, "id" | "created_at">;

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: AgentRow;
        Insert: AgentInsert;
        Update: AgentUpdate;
        Relationships: [];
      };
      epochs: {
        Row: EpochRow;
        Insert: EpochInsert;
        Update: EpochUpdate;
        Relationships: [];
      };
      trades: {
        Row: TradeRow;
        Insert: TradeInsert;
        Update: TradeUpdate;
        Relationships: [];
      };
      rankings: {
        Row: RankingRow;
        Insert: RankingInsert;
        Update: RankingUpdate;
        Relationships: [];
      };
      positions: {
        Row: PositionRow;
        Insert: PositionInsert;
        Update: PositionUpdate;
        Relationships: [];
      };
      telegram_feedback: {
        Row: TelegramFeedbackRow;
        Insert: TelegramFeedbackInsert;
        Update: TelegramFeedbackUpdate;
        Relationships: [];
      };
      telegram_user_state: {
        Row: TelegramUserStateRow;
        Insert: TelegramUserStateInsert;
        Update: TelegramUserStateUpdate;
        Relationships: [];
      };
      payout_batches: {
        Row: PayoutBatchRow;
        Insert: PayoutBatchInsert;
        Update: PayoutBatchUpdate;
        Relationships: [];
      };
      payout_items: {
        Row: PayoutItemRow;
        Insert: PayoutItemInsert;
        Update: PayoutItemUpdate;
        Relationships: [];
      };
      treasury_ledger: {
        Row: TreasuryLedgerRow;
        Insert: TreasuryLedgerInsert;
        Update: Partial<TreasuryLedgerInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
