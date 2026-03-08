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
  operating_costs_sol: number;
  prize_pool_sol: number;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
