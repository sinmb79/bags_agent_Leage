ALTER TABLE epochs
  ADD COLUMN IF NOT EXISTS gross_fees_claimed_sol NUMERIC(20, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS operator_revenue_sol NUMERIC(20, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserve_sol NUMERIC(20, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_distributable_sol NUMERIC(20, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reserve_balance_after_epoch NUMERIC(20, 8) DEFAULT 0;

CREATE TABLE IF NOT EXISTS payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epoch_id UUID NOT NULL UNIQUE REFERENCES epochs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (
    status IN ('pending_approval', 'approved', 'held', 'cancelled', 'executing', 'completed', 'partial_failure')
  ),
  treasury_wallet_address TEXT NOT NULL,
  operator_wallet_address TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  gross_fees_claimed_sol NUMERIC(20, 8) NOT NULL DEFAULT 0,
  prize_pool_sol NUMERIC(20, 8) NOT NULL DEFAULT 0,
  operator_revenue_sol NUMERIC(20, 8) NOT NULL DEFAULT 0,
  reserve_sol NUMERIC(20, 8) NOT NULL DEFAULT 0,
  net_distributable_sol NUMERIC(20, 8) NOT NULL DEFAULT 0,
  reserve_balance_after_epoch NUMERIC(20, 8) NOT NULL DEFAULT 0,
  admin_message_id TEXT,
  approval_requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by_telegram_user_id TEXT,
  approved_by_telegram_username TEXT,
  executed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_batches_status ON payout_batches(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_payout_batches_scheduled_for ON payout_batches(scheduled_for);

CREATE TABLE IF NOT EXISTS payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_batch_id UUID NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
  epoch_id UUID NOT NULL REFERENCES epochs(id) ON DELETE CASCADE,
  ranking_id UUID REFERENCES rankings(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  item_key TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('operator_revenue', 'prize_payout')),
  rank INTEGER,
  recipient_wallet_address TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  amount_sol NUMERIC(20, 8) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  tx_signature TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payout_batch_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_payout_items_batch_status ON payout_items(payout_batch_id, status);
CREATE INDEX IF NOT EXISTS idx_payout_items_epoch ON payout_items(epoch_id);

CREATE TABLE IF NOT EXISTS treasury_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epoch_id UUID REFERENCES epochs(id) ON DELETE SET NULL,
  payout_batch_id UUID REFERENCES payout_batches(id) ON DELETE SET NULL,
  payout_item_id UUID REFERENCES payout_items(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK (
    entry_type IN ('fee_claim', 'operator_allocation', 'reserve_allocation', 'prize_payout', 'payout_reversal')
  ),
  amount_sol NUMERIC(20, 8) NOT NULL DEFAULT 0,
  wallet_address TEXT NOT NULL,
  tx_signature TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treasury_ledger_entry_type ON treasury_ledger(entry_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_ledger_batch ON treasury_ledger(payout_batch_id, created_at DESC);

CREATE TRIGGER trg_payout_batches_updated_at
BEFORE UPDATE ON payout_batches
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_updated_at();

CREATE TRIGGER trg_payout_items_updated_at
BEFORE UPDATE ON payout_items
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_updated_at();

ALTER TABLE payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service write payout batches" ON payout_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write payout items" ON payout_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write treasury ledger" ON treasury_ledger FOR ALL USING (true) WITH CHECK (true);
