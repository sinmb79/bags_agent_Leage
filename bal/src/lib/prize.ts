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
  getPayoutBatchById,
  listApprovalPendingPayoutBatches,
  listPayoutItemsByBatch,
  listRunnablePayoutBatches,
  updatePayoutBatch,
  updatePayoutItem,
  upsertRanking
} from "@/lib/supabase/queries";
import type { Database, PayoutBatchRow, PayoutItemRow } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown error";
}

export async function getRunnableSettlementBatches(client: Client, scheduledBefore = new Date().toISOString()) {
  return listRunnablePayoutBatches(client, scheduledBefore);
}

export async function getApprovalPendingSettlementBatches(
  client: Client,
  scheduledBefore = new Date().toISOString()
) {
  return listApprovalPendingPayoutBatches(client, scheduledBefore);
}

export function sortPayoutItems(items: PayoutItemRow[]) {
  return [...items].sort((left, right) => {
    if (left.item_type !== right.item_type) {
      return left.item_type === "operator_revenue" ? -1 : 1;
    }

    return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
  });
}

export function sumOutstandingPayout(items: PayoutItemRow[]) {
  return Number(
    items
      .filter((item) => item.status !== "completed" && item.status !== "cancelled")
      .reduce((sum, item) => sum + Number(item.amount_sol ?? 0), 0)
      .toFixed(8)
  );
}

export async function getSettlementBatchContext(client: Client, payoutBatchId: string) {
  const batch = await getPayoutBatchById(client, payoutBatchId);
  if (!batch) {
    return null;
  }

  const items = await listPayoutItemsByBatch(client, payoutBatchId);
  return {
    batch,
    items
  };
}

export async function markSettlementBatchExecuting(client: Client, payoutBatchId: string): Promise<PayoutBatchRow> {
  return updatePayoutBatch(client, payoutBatchId, {
    status: "executing",
    failure_reason: null
  });
}

export async function holdSettlementBatch(
  client: Client,
  payoutBatchId: string,
  reason: string
): Promise<PayoutBatchRow> {
  return updatePayoutBatch(client, payoutBatchId, {
    status: "held",
    failure_reason: reason
  });
}

export async function finalizeSettlementBatch(
  client: Client,
  payoutBatchId: string,
  input: {
    status: "completed" | "partial_failure";
    failureReason?: string | null;
  }
): Promise<PayoutBatchRow> {
  return updatePayoutBatch(client, payoutBatchId, {
    status: input.status,
    failure_reason: input.failureReason ?? null,
    executed_at: new Date().toISOString()
  });
}

export async function markPayoutItemProcessing(client: Client, item: PayoutItemRow) {
  return updatePayoutItem(client, item.id, {
    status: "processing",
    attempt_count: Number(item.attempt_count ?? 0) + 1,
    last_error: null
  });
}

export async function markPayoutItemFailed(client: Client, item: PayoutItemRow, error: unknown) {
  return updatePayoutItem(client, item.id, {
    status: "failed",
    last_error: normalizeErrorMessage(error)
  });
}

export async function markPayoutItemCompleted(client: Client, item: PayoutItemRow, txSignature: string) {
  const updated = await updatePayoutItem(client, item.id, {
    status: "completed",
    tx_signature: txSignature,
    last_error: null
  });

  if (item.item_type === "prize_payout" && item.agent_id) {
    await upsertRanking(client, item.epoch_id, item.agent_id, {
      rank: item.rank,
      prize_sol: Number(item.amount_sol ?? 0),
      prize_tx_signature: txSignature
    });
  }

  return updated;
}

export async function transferSolPayout(
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
