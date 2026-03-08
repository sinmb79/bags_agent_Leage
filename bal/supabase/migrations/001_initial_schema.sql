CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  wallet_address TEXT UNIQUE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now(),
  total_trades INTEGER DEFAULT 0,
  total_pnl_sol NUMERIC(20, 8) DEFAULT 0,
  win_rate NUMERIC(5, 2) DEFAULT 0
);

CREATE INDEX idx_agents_wallet ON agents(wallet_address);

CREATE TABLE epochs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epoch_number INTEGER UNIQUE NOT NULL,
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  total_fees_sol NUMERIC(20, 8) DEFAULT 0,
  operating_costs_sol NUMERIC(20, 8) DEFAULT 0,
  prize_pool_sol NUMERIC(20, 8) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'calculating', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_epochs_status ON epochs(status);
CREATE INDEX idx_epochs_number ON epochs(epoch_number DESC);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  epoch_id UUID REFERENCES epochs(id),
  token_mint TEXT NOT NULL,
  token_symbol TEXT,
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  amount_sol NUMERIC(20, 8) NOT NULL,
  token_amount NUMERIC(30, 8),
  price_per_token NUMERIC(30, 12),
  tx_signature TEXT UNIQUE NOT NULL,
  traded_at TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trades_agent ON trades(agent_id);
CREATE INDEX idx_trades_epoch ON trades(epoch_id);
CREATE INDEX idx_trades_signature ON trades(tx_signature);
CREATE INDEX idx_trades_traded_at ON trades(traded_at DESC);

CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epoch_id UUID NOT NULL REFERENCES epochs(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  rank INTEGER,
  pnl_sol NUMERIC(20, 8) DEFAULT 0,
  sharpe_ratio NUMERIC(10, 4) DEFAULT 0,
  max_drawdown NUMERIC(10, 4) DEFAULT 0,
  trade_efficiency NUMERIC(10, 4) DEFAULT 0,
  composite_score NUMERIC(10, 4) DEFAULT 0,
  prize_sol NUMERIC(20, 8) DEFAULT 0,
  prize_tx_signature TEXT,
  UNIQUE(epoch_id, agent_id)
);

CREATE INDEX idx_rankings_epoch ON rankings(epoch_id);
CREATE INDEX idx_rankings_score ON rankings(epoch_id, composite_score DESC);

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  token_mint TEXT NOT NULL,
  token_symbol TEXT,
  amount NUMERIC(30, 8) DEFAULT 0,
  avg_buy_price NUMERIC(30, 12) DEFAULT 0,
  current_price NUMERIC(30, 12) DEFAULT 0,
  unrealized_pnl_sol NUMERIC(20, 8) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, token_mint)
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE epochs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON agents FOR SELECT USING (true);
CREATE POLICY "Public read" ON trades FOR SELECT USING (true);
CREATE POLICY "Public read" ON epochs FOR SELECT USING (true);
CREATE POLICY "Public read" ON rankings FOR SELECT USING (true);
CREATE POLICY "Public read" ON positions FOR SELECT USING (true);

CREATE POLICY "Service write" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON epochs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON rankings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write" ON positions FOR ALL USING (true) WITH CHECK (true);

