import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type Connection
} from "@solana/web3.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAgentById,
  getEpochById,
  listPendingPrizeDistribution,
  updateEpoch,
  upsertRanking
} from "@/lib/supabase/queries";

type Client = SupabaseClient;

export async function getPendingPrizeDistribution(client: Client) {
  const pending = await listPendingPrizeDistribution(client);
  if (!pending.length) {
    return { epoch: null, winners: [] };
  }

  const epoch = await getEpochById(client, pending[0].epoch_id);
  const winners = await Promise.all(
    pending.map(async (ranking) => {
      const agent = await getAgentById(client, ranking.agent_id);
      return {
        ranking,
        agent
      };
    })
  );

  return { epoch, winners };
}

export async function transferSolPrize(
  connection: Connection,
  fromKeypair: Keypair,
  toAddress: string,
  amountSol: number
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(toAddress),
      lamports: Math.round(amountSol * LAMPORTS_PER_SOL)
    })
  );

  const signature = await connection.sendTransaction(transaction, [fromKeypair]);
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}

export async function markPrizeDistributed(client: Client, rankingId: string, txSignature: string) {
  const pending = await listPendingPrizeDistribution(client);
  const ranking = pending.find((item) => item.id === rankingId);
  if (!ranking) {
    throw new Error("Ranking not found.");
  }

  await upsertRanking(client, ranking.epoch_id, ranking.agent_id, {
    prize_tx_signature: txSignature
  });

  const remaining = (await listPendingPrizeDistribution(client)).filter(
    (item) => item.epoch_id === ranking.epoch_id
  );
  if (!remaining.length) {
    await updateEpoch(client, ranking.epoch_id, { status: "completed" });
  }
}
