import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { claimPartnerFees } from "../src/lib/bags/partner";
import {
  finalizeSettlementBatch,
  getApprovalPendingSettlementBatches,
  getRunnableSettlementBatches,
  holdSettlementBatch,
  markPayoutItemCompleted,
  markPayoutItemFailed,
  markPayoutItemProcessing,
  markSettlementBatchExecuting,
  sortPayoutItems,
  transferSolPayout
} from "../src/lib/prize";
import { getTreasuryWalletBalance } from "../src/lib/settlement";
import {
  getEpochById,
  insertTreasuryLedgerEntries,
  listPayoutItemsByBatch,
  listTreasuryLedgerByType
} from "../src/lib/supabase/queries";
import type { Database, PayoutBatchRow, PayoutItemRow } from "../src/lib/supabase/types";
import { announcePrizeDistributionSummary } from "../src/lib/telegram/announcements";
import {
  sendInsufficientFundsAlert,
  sendPartialFailureAlert,
  sendSettlementApprovalReminder
} from "../src/lib/telegram/settlement";

async function safeNotify(label: string, callback: () => Promise<unknown>) {
  try {
    await callback();
  } catch (error) {
    console.error(`${label} failed`, error);
  }
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function roundSol(value: number) {
  return Number(value.toFixed(8));
}

function itemLabel(item: PayoutItemRow) {
  return item.item_type === "operator_revenue" ? "Operator revenue" : `#${item.rank ?? "-"} ${item.recipient_name}`;
}

function ledgerEntryType(item: PayoutItemRow) {
  return item.item_type === "operator_revenue" ? "operator_allocation" : "prize_payout";
}

function sumRunnableAmount(items: PayoutItemRow[]) {
  return roundSol(
    items
      .filter((item) => item.status === "pending" || item.status === "failed")
      .reduce((sum, item) => sum + Number(item.amount_sol ?? 0), 0)
  );
}

async function ensureReserveLedger(
  supabase: SupabaseClient<Database>,
  batch: PayoutBatchRow
) {
  if (Number(batch.reserve_sol ?? 0) <= 0) {
    return;
  }

  const existing = await listTreasuryLedgerByType(supabase, "reserve_allocation", batch.id);
  if (existing.length) {
    return;
  }

  await insertTreasuryLedgerEntries(supabase, [
    {
      epoch_id: batch.epoch_id,
      payout_batch_id: batch.id,
      payout_item_id: null,
      entry_type: "reserve_allocation",
      amount_sol: Number(batch.reserve_sol ?? 0),
      wallet_address: batch.treasury_wallet_address,
      tx_signature: null,
      note: `Reserve allocation for settlement batch ${batch.id}`
    }
  ]);
}

async function ensureFeeClaim(
  supabase: SupabaseClient<Database>,
  connection: Connection,
  treasuryKeypair: Keypair,
  batch: PayoutBatchRow
) {
  const existing = await listTreasuryLedgerByType(supabase, "fee_claim", batch.id);
  if (existing.length) {
    return existing;
  }

  const claimed = await claimPartnerFees(connection, treasuryKeypair);
  if (claimed.claimedAmountSol <= 0) {
    return [];
  }

  return insertTreasuryLedgerEntries(supabase, [
    {
      epoch_id: batch.epoch_id,
      payout_batch_id: batch.id,
      payout_item_id: null,
      entry_type: "fee_claim",
      amount_sol: claimed.claimedAmountSol,
      wallet_address: batch.treasury_wallet_address,
      tx_signature: claimed.signatures[0] ?? null,
      note: `Claimed ${claimed.positionsClaimed} fee positions. Signatures: ${claimed.signatures.join(", ")}`
    }
  ]);
}

async function processBatch(input: {
  supabase: SupabaseClient<Database>;
  connection: Connection;
  treasuryKeypair: Keypair;
  batch: PayoutBatchRow;
}) {
  const { supabase, connection, treasuryKeypair, batch } = input;
  const epoch = await getEpochById(supabase, batch.epoch_id);
  const epochNumber = epoch?.epoch_number ?? 0;

  await markSettlementBatchExecuting(supabase, batch.id);
  await ensureFeeClaim(supabase, connection, treasuryKeypair, batch);
  await ensureReserveLedger(supabase, batch);

  const allItems = await listPayoutItemsByBatch(supabase, batch.id);
  const processingItems = allItems.filter((item) => item.status === "processing");
  const runnableItems = sortPayoutItems(allItems).filter(
    (item) => item.status === "pending" || item.status === "failed"
  );

  if (processingItems.length) {
    const updatedBatch = await finalizeSettlementBatch(supabase, batch.id, {
      status: "partial_failure",
      failureReason: "Some payout items were left in processing state and require manual review."
    });

    await safeNotify("sendPartialFailureAlert", () =>
      sendPartialFailureAlert(supabase, {
        payoutBatchId: batch.id,
        failedItems: processingItems.map((item) => ({
          label: itemLabel(item),
          reason: "processing state requires manual review"
        }))
      })
    );

    return updatedBatch;
  }

  if (!runnableItems.length) {
    const completedBatch = await finalizeSettlementBatch(supabase, batch.id, {
      status: "completed"
    });

    const prizeTransfers = sortPayoutItems(allItems).filter(
      (item) => item.item_type === "prize_payout" && item.status === "completed"
    );

    if (epochNumber > 0 && prizeTransfers.length) {
      await safeNotify("announcePrizeDistributionSummary", () =>
        announcePrizeDistributionSummary({
          epochNumber,
          transferred: prizeTransfers.map((item) => ({
            rank: item.rank ?? 0,
            agentName: item.recipient_name,
            prizeSol: Number(item.amount_sol ?? 0),
            txSignature: item.tx_signature ?? ""
          })),
          failed: []
        })
      );
    }

    return completedBatch;
  }

  const requiredSol = sumRunnableAmount(runnableItems);
  const availableSol = await getTreasuryWalletBalance(batch.treasury_wallet_address);

  if (availableSol === null || availableSol + 0.00000001 < requiredSol) {
    const held = await holdSettlementBatch(
      supabase,
      batch.id,
      `Insufficient treasury balance. Required ${requiredSol} SOL, available ${availableSol ?? 0} SOL.`
    );

    await safeNotify("sendInsufficientFundsAlert", () =>
      sendInsufficientFundsAlert(supabase, {
        payoutBatchId: batch.id,
        requiredSol,
        availableSol
      })
    );

    return held;
  }

  for (const item of runnableItems) {
    const processing = await markPayoutItemProcessing(supabase, item);

    try {
      const signature = await transferSolPayout(
        connection,
        treasuryKeypair,
        item.recipient_wallet_address,
        Number(item.amount_sol ?? 0)
      );

      const completed = await markPayoutItemCompleted(supabase, processing, signature);
      await insertTreasuryLedgerEntries(supabase, [
        {
          epoch_id: completed.epoch_id,
          payout_batch_id: completed.payout_batch_id,
          payout_item_id: completed.id,
          entry_type: ledgerEntryType(completed),
          amount_sol: Number(completed.amount_sol ?? 0),
          wallet_address: completed.recipient_wallet_address,
          tx_signature: signature,
          note: `${itemLabel(completed)} payout`
        }
      ]);

      console.log(
        `Settlement transfer sent: batch=${batch.id} item=${completed.item_key} wallet=${completed.recipient_wallet_address} signature=${signature}`
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      await markPayoutItemFailed(supabase, processing, error);
      console.error(`Settlement transfer failed: batch=${batch.id} item=${item.item_key}`, error);
    }
  }

  const finalItems = await listPayoutItemsByBatch(supabase, batch.id);
  const remainingFailures = finalItems
    .filter((item) => item.status === "failed" || item.status === "processing")
    .map((item) => ({
      label: itemLabel(item),
      reason: item.last_error ?? "processing state requires manual review"
    }));

  const prizeTransfers = sortPayoutItems(finalItems).filter(
    (item) => item.item_type === "prize_payout" && item.status === "completed"
  );

  if (remainingFailures.length) {
    const updatedBatch = await finalizeSettlementBatch(supabase, batch.id, {
      status: "partial_failure",
      failureReason: "One or more payout items failed."
    });

    await safeNotify("sendPartialFailureAlert", () =>
      sendPartialFailureAlert(supabase, {
        payoutBatchId: batch.id,
        failedItems: remainingFailures
      })
    );

    return updatedBatch;
  }

  const completedBatch = await finalizeSettlementBatch(supabase, batch.id, {
    status: "completed"
  });

  if (epochNumber > 0 && prizeTransfers.length) {
    await safeNotify("announcePrizeDistributionSummary", () =>
      announcePrizeDistributionSummary({
        epochNumber,
        transferred: prizeTransfers.map((item) => ({
          rank: item.rank ?? 0,
          agentName: item.recipient_name,
          prizeSol: Number(item.amount_sol ?? 0),
          txSignature: item.tx_signature ?? ""
        })),
        failed: []
      })
    );
  }

  return completedBatch;
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
  const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(requireEnv("BAL_PARTNER_PRIVATE_KEY")));
  const nowIso = new Date().toISOString();

  const approvalPending = await getApprovalPendingSettlementBatches(supabase, nowIso);
  for (const batch of approvalPending) {
    await safeNotify("sendSettlementApprovalReminder", () =>
      sendSettlementApprovalReminder(supabase, batch.id)
    );
  }

  const runnableBatches = await getRunnableSettlementBatches(supabase, nowIso);
  if (!runnableBatches.length) {
    console.log("No approved settlement batches to execute.");
    return;
  }

  for (const batch of runnableBatches) {
    console.log(`Executing settlement batch ${batch.id} for epoch ${batch.epoch_id}`);
    await processBatch({
      supabase,
      connection,
      treasuryKeypair,
      batch
    });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
