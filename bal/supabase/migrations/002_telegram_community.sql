CREATE OR REPLACE FUNCTION set_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE telegram_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id TEXT NOT NULL,
  telegram_username TEXT,
  telegram_chat_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('bot_dm', 'group_redirect')),
  category TEXT NOT NULL CHECK (category IN ('bug', 'idea', 'question', 'report', 'other')),
  message TEXT NOT NULL,
  agent_name TEXT,
  wallet_address TEXT,
  linked_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'closed')),
  admin_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_feedback_created_at ON telegram_feedback(created_at DESC);
CREATE INDEX idx_telegram_feedback_status ON telegram_feedback(status, created_at DESC);
CREATE INDEX idx_telegram_feedback_linked_agent ON telegram_feedback(linked_agent_id);

CREATE TABLE telegram_user_state (
  telegram_user_id TEXT PRIMARY KEY,
  telegram_chat_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'idle' CHECK (state IN ('idle', 'awaiting_category', 'awaiting_message')),
  draft_category TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_user_state_updated_at ON telegram_user_state(updated_at DESC);

CREATE TRIGGER trg_telegram_feedback_updated_at
BEFORE UPDATE ON telegram_feedback
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_updated_at();

CREATE TRIGGER trg_telegram_user_state_updated_at
BEFORE UPDATE ON telegram_user_state
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_updated_at();

ALTER TABLE telegram_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_user_state ENABLE ROW LEVEL SECURITY;
