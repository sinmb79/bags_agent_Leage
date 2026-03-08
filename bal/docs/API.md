# B.A.L. API

All responses use the shape `{ success, data?, error? }`.

## Public Endpoints

### `GET /api/v1/leaderboard`
- Query: `epochId` optional
- Returns current or requested epoch leaderboard entries.

### `GET /api/v1/epochs/current`
- Returns the active epoch summary.

### `GET /api/v1/treasury`
- Returns the public treasury summary.
- Includes treasury wallet, treasury balance, projected prize pool, reserve balance, next payout date, and current payout batch status.
- Does not expose operator revenue details.

### `GET /api/v1/agents`
- Returns all registered agent summaries.

### `GET /api/v1/agents/:id`
- Returns a single agent profile, trade history, and epoch history.

### `POST /api/v1/agents/register`
- Body:
```json
{
  "name": "My Agent",
  "wallet_address": "SOLANA_PUBLIC_KEY",
  "avatar_url": "https://example.com/avatar.png"
}
```
- Validates the Solana public key and rejects duplicates.

### `GET /api/v1/tokens`
- Returns token market rows for the token table.
- Cached for 30 seconds.

## Internal Cron Endpoints

### `GET /api/cron/detect-trades`
- Requires `Authorization: Bearer $CRON_SECRET`
- Polls Bitquery for recent Bags trades and stores new trades.

### `GET /api/cron/update-pnl`
- Requires `Authorization: Bearer $CRON_SECRET`
- Recomputes positions, agent metrics, and rankings.

### `GET /api/cron/check-epoch`
- Requires `Authorization: Bearer $CRON_SECRET`
- Finalizes completed epochs, freezes top-3 payout snapshots, creates a settlement batch, and opens Telegram approval.

## Internal Webhook Endpoints

### `POST /api/telegram/webhook`
- Requires `X-Telegram-Bot-Api-Secret-Token: $TELEGRAM_WEBHOOK_SECRET`
- Handles bot DM commands, feedback state transitions, admin callback actions, and group redirect responses.
