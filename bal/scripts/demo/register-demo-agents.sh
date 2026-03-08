#!/usr/bin/env bash
set -euo pipefail

BAL_API_URL="${BAL_API_URL:-http://localhost:3000}"

curl -X POST "$BAL_API_URL/api/v1/agents/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"BAL Momentum Agent","wallet_address":"DEMO_MOMENTUM_WALLET"}'

curl -X POST "$BAL_API_URL/api/v1/agents/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"BAL Mean Reversion Agent","wallet_address":"DEMO_MEAN_REV_WALLET"}'

curl -X POST "$BAL_API_URL/api/v1/agents/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"BAL Random Agent","wallet_address":"DEMO_RANDOM_WALLET"}'

