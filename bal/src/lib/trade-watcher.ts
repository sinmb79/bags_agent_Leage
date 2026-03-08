import type { SupabaseClient } from "@supabase/supabase-js";
import { BAGS_AUTHORITY, SOL_MINT } from "@/lib/constants";
import { getActiveEpoch, getExistingTradeSignatures } from "@/lib/supabase/queries";
import type { TradeInsert } from "@/lib/supabase/types";

export interface BitqueryTrade {
  Trade: {
    Buy: {
      Amount: number;
      AmountInUSD?: number;
      Currency: { Symbol?: string; Name?: string; MintAddress: string };
      Price?: number;
    };
    Sell: {
      Amount: number;
      AmountInUSD?: number;
      Currency: { Symbol?: string; Name?: string; MintAddress: string };
      Price?: number;
    };
  };
  Block: { Time: string };
  Transaction: { Signature: string; FeePayer: string };
}

function buildBitqueryQuery(since: string) {
  return `{
    Solana {
      DEXTrades(
        where: {
          any: [
            { Trade: { Buy: { Currency: { UpdateAuthority: { is: "${BAGS_AUTHORITY}" } } } } },
            { Trade: { Sell: { Currency: { UpdateAuthority: { is: "${BAGS_AUTHORITY}" } } } } }
          ],
          Block: { Time: { after: "${since}" } }
        }
        limit: { count: 100 }
        orderBy: { descending: Block_Time }
      ) {
        Trade {
          Buy { Amount AmountInUSD Currency { Symbol Name MintAddress } Price }
          Sell { Amount AmountInUSD Currency { Symbol Name MintAddress } Price }
        }
        Block { Time }
        Transaction { Signature FeePayer }
      }
    }
  }`;
}

async function fetchBitqueryTrades(since: string) {
  if (!process.env.BITQUERY_API_KEY) {
    return [] as BitqueryTrade[];
  }

  const response = await fetch("https://streaming.bitquery.io/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.BITQUERY_API_KEY
    },
    body: JSON.stringify({
      query: buildBitqueryQuery(since)
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Bitquery request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: { Solana?: { DEXTrades?: BitqueryTrade[] } };
  };

  return payload.data?.Solana?.DEXTrades ?? [];
}

export function parseBitqueryTrade(raw: BitqueryTrade, agentId: string, epochId: string | null): TradeInsert {
  const buyMint = raw.Trade.Buy.Currency.MintAddress;
  const isBuy = buyMint !== SOL_MINT;
  const tokenSide = isBuy ? raw.Trade.Buy : raw.Trade.Sell;
  const solSide = isBuy ? raw.Trade.Sell : raw.Trade.Buy;

  return {
    agent_id: agentId,
    epoch_id: epochId,
    token_mint: tokenSide.Currency.MintAddress,
    token_symbol: tokenSide.Currency.Symbol ?? tokenSide.Currency.Name ?? "TOKEN",
    action: isBuy ? "buy" : "sell",
    amount_sol: Number(solSide.Amount ?? 0),
    token_amount: Number(tokenSide.Amount ?? 0),
    price_per_token: Number(tokenSide.Price ?? 0),
    tx_signature: raw.Transaction.Signature,
    traded_at: raw.Block.Time
  };
}

export async function detectNewTrades(
  supabase: SupabaseClient,
  agents: Array<{ id: string; wallet_address: string }>,
  since: Date
) {
  const walletMap = new Map(agents.map((agent) => [agent.wallet_address, agent.id]));
  const [epoch, rawTrades] = await Promise.all([getActiveEpoch(supabase), fetchBitqueryTrades(since.toISOString())]);
  const existingSignatures = new Set(
    await getExistingTradeSignatures(
      supabase,
      rawTrades.map((trade) => trade.Transaction.Signature)
    )
  );

  return rawTrades
    .filter((trade) => walletMap.has(trade.Transaction.FeePayer))
    .filter((trade) => !existingSignatures.has(trade.Transaction.Signature))
    .map((trade) => parseBitqueryTrade(trade, walletMap.get(trade.Transaction.FeePayer)!, epoch?.id ?? null));
}
