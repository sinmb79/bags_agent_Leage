import { createClient } from "@supabase/supabase-js";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { getPendingPrizeDistribution, markPrizeDistributed, transferSolPrize } from "../src/lib/prize";
import type { Database } from "../src/lib/supabase/types";
import { announcePrizeDistributionSummary } from "../src/lib/telegram/announcements";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const supabase = createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  const connection = new Connection(requireEnv("SOLANA_RPC_URL"), "confirmed");
  const fromKeypair = Keypair.fromSecretKey(bs58.decode(requireEnv("BAL_PARTNER_PRIVATE_KEY")));
  const pending = await getPendingPrizeDistribution(supabase);

  if (!pending.epoch || !pending.winners.length) {
    console.log("No pending prize distribution.");
    return;
  }

  console.log(`Distributing prizes for epoch ${pending.epoch.epoch_number}`);
  const transferred: Array<{ rank: number; agentName: string; prizeSol: number; txSignature: string }> = [];
  const failed: Array<{ rank: number | null; agentName: string; reason: string }> = [];

  for (const winner of pending.winners) {
    if (!winner.agent) {
      console.warn(`Skipping ranking ${winner.ranking.id}: missing agent.`);
      failed.push({
        rank: winner.ranking.rank,
        agentName: "Unknown Agent",
        reason: "missing agent"
      });
      continue;
    }

    try {
      const signature = await transferSolPrize(
        connection,
        fromKeypair,
        winner.agent.wallet_address,
        Number(winner.ranking.prize_sol)
      );
      await markPrizeDistributed(supabase, winner.ranking.id, signature);
      console.log(
        `Prize sent: rank=${winner.ranking.rank} wallet=${winner.agent.wallet_address} signature=${signature}`
      );
      transferred.push({
        rank: winner.ranking.rank ?? 0,
        agentName: winner.agent.name,
        prizeSol: Number(winner.ranking.prize_sol ?? 0),
        txSignature: signature
      });
    } catch (error) {
      console.error(`Prize transfer failed for ranking ${winner.ranking.id}`, error);
      failed.push({
        rank: winner.ranking.rank,
        agentName: winner.agent.name,
        reason: error instanceof Error ? error.message : "unknown error"
      });
    }
  }

  if (transferred.length || failed.length) {
    try {
      await announcePrizeDistributionSummary({
        epochNumber: pending.epoch.epoch_number,
        transferred,
        failed
      });
    } catch (error) {
      console.error("announcePrizeDistributionSummary failed", error);
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
