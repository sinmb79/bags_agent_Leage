import { PublicKey } from "@solana/web3.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPartnerFeeBalance } from "@/lib/bags/partner";
import { getSettlementConfig } from "@/lib/env";
import { mockTreasurySummary } from "@/lib/mock-data";
import { getSolanaConnection } from "@/lib/solana/connection";
import {
  createPayoutBatch,
  getLatestPayoutBatch,
  getPayoutBatchByEpochId,
  insertPayoutItems,
  listTreasuryLedgerByType,
  updateEpoch
} from "@/lib/supabase/queries";
import type { Database, EpochRow, PayoutBatchRow, PayoutItemRow } from "@/lib/supabase/types";
import type { TreasurySummary } from "@/types";

type Client = SupabaseClient<Database>;

function roundSol(value: number) {
  return Number(value.toFixed(8));
}

export interface SettlementBreakdown {
  grossFeesClaimedSol: number;
  prizePoolSol: number;
  operatorRevenueSol: number;
  reserveSol: number;
  netDistributableSol: number;
  prizeSplit: {
    first: number;
    second: number;
    third: number;
  };
}

export interface SettlementWinnerSnapshot {
  agentId: string;
  agentName: string;
  walletAddress: string;
  rankingId: string;
  rank: number;
  prizeSol: number;
}

export function calculateSettlementBreakdown(grossFeesSol: number): SettlementBreakdown {
  const { prizeShareBps, revenueShareBps } = getSettlementConfig();
  const gross = roundSol(Math.max(grossFeesSol, 0));
  const prizePoolSol = roundSol((gross * prizeShareBps) / 10_000);
  const operatorRevenueSol = roundSol((gross * revenueShareBps) / 10_000);
  const reserveSol = roundSol(Math.max(gross - prizePoolSol - operatorRevenueSol, 0));
  const first = roundSol(prizePoolSol * 0.5);
  const second = roundSol(prizePoolSol * 0.3);
  const third = roundSol(Math.max(prizePoolSol - first - second, 0));

  return {
    grossFeesClaimedSol: gross,
    prizePoolSol,
    operatorRevenueSol,
    reserveSol,
    netDistributableSol: roundSol(prizePoolSol + operatorRevenueSol),
    prizeSplit: {
      first,
      second,
      third
    }
  };
}

export function getSettlementScheduledFor(epoch: Pick<EpochRow, "week_end">) {
  const scheduledFor = new Date(epoch.week_end);
  scheduledFor.setUTCDate(scheduledFor.getUTCDate() + 1);
  scheduledFor.setUTCHours(1, 5, 0, 0);
  return scheduledFor.toISOString();
}

export async function getReserveBalance(client: Client) {
  const reserveEntries = await listTreasuryLedgerByType(client, "reserve_allocation");
  return roundSol(
    reserveEntries.reduce((sum, entry) => sum + Number(entry.amount_sol ?? 0), 0)
  );
}

export async function getTreasuryWalletBalance(walletAddress: string | null) {
  if (!walletAddress) {
    return null;
  }

  try {
    const publicKey = new PublicKey(walletAddress);
    const lamports = await getSolanaConnection().getBalance(publicKey, "confirmed");
    return roundSol(lamports / 1_000_000_000);
  } catch (error) {
    console.error("getTreasuryWalletBalance failed", error);
    return null;
  }
}

export async function getTreasurySummary(client: Client | null): Promise<TreasurySummary> {
  const settlement = getSettlementConfig();
  if (!client) {
    return mockTreasurySummary;
  }

  try {
    const [latestBatch, reserveBalanceSol, claimableFeesSol, treasuryBalanceSol] = await Promise.all([
      getLatestPayoutBatch(client),
      getReserveBalance(client),
      getPartnerFeeBalance().catch((error) => {
        console.error("getPartnerFeeBalance failed", error);
        return 0;
      }),
      getTreasuryWalletBalance(settlement.partnerWallet)
    ]);

    const projected = calculateSettlementBreakdown(claimableFeesSol);
    const lastPayoutStatus = latestBatch?.status ?? null;
    const currentPayoutBatchStatus =
      latestBatch && ["pending_approval", "approved", "held", "executing", "partial_failure"].includes(latestBatch.status)
        ? latestBatch.status
        : null;

    return {
      treasuryWallet: settlement.partnerWallet,
      treasuryBalanceSol,
      currentPrizePoolSol: projected.prizePoolSol,
      reserveBalanceSol,
      nextPayoutDate: latestBatch?.scheduled_for ?? null,
      lastPayoutStatus,
      currentPayoutBatchStatus
    };
  } catch (error) {
    console.error("getTreasurySummary failed", error);
    return mockTreasurySummary;
  }
}

export async function prepareSettlementBatch(
  client: Client,
  input: {
    epoch: EpochRow;
    winners: SettlementWinnerSnapshot[];
  }
): Promise<{ batch: PayoutBatchRow; items: PayoutItemRow[]; created: boolean }> {
  const existingBatch = await getPayoutBatchByEpochId(client, input.epoch.id);
  if (existingBatch) {
    return {
      batch: existingBatch,
      items: [],
      created: false
    };
  }

  const settlement = getSettlementConfig();
  const reserveBalanceBefore = await getReserveBalance(client);
  const reserveBalanceAfterEpoch = roundSol(
    reserveBalanceBefore + Number(input.epoch.reserve_sol ?? 0)
  );

  const epoch =
    reserveBalanceAfterEpoch !== Number(input.epoch.reserve_balance_after_epoch ?? 0)
      ? await updateEpoch(client, input.epoch.id, {
          reserve_balance_after_epoch: reserveBalanceAfterEpoch
        })
      : input.epoch;

  const configurationIssue =
    !settlement.partnerWallet
      ? "BAL_PARTNER_WALLET is not configured."
      : !settlement.operatorWallet
        ? "BAL_OPERATOR_WALLET is not configured."
        : null;

  const batch = await createPayoutBatch(client, {
    epoch_id: epoch.id,
    status: configurationIssue ? "held" : "pending_approval",
    treasury_wallet_address: settlement.partnerWallet ?? "UNCONFIGURED_TREASURY",
    operator_wallet_address: settlement.operatorWallet ?? "UNCONFIGURED_OPERATOR",
    scheduled_for: getSettlementScheduledFor(epoch),
    gross_fees_claimed_sol: Number(epoch.gross_fees_claimed_sol ?? 0),
    prize_pool_sol: Number(epoch.prize_pool_sol ?? 0),
    operator_revenue_sol: Number(epoch.operator_revenue_sol ?? 0),
    reserve_sol: Number(epoch.reserve_sol ?? 0),
    net_distributable_sol: Number(epoch.net_distributable_sol ?? 0),
    reserve_balance_after_epoch: reserveBalanceAfterEpoch,
    failure_reason: configurationIssue,
    approval_requested_at: new Date().toISOString()
  });

  const itemPayload = [
    ...(Number(epoch.operator_revenue_sol ?? 0) > 0 && settlement.operatorWallet
      ? [
          {
            payout_batch_id: batch.id,
            epoch_id: epoch.id,
            ranking_id: null,
            agent_id: null,
            item_key: "operator_revenue",
            item_type: "operator_revenue" as const,
            rank: null,
            recipient_wallet_address: settlement.operatorWallet,
            recipient_name: "Operator Revenue",
            amount_sol: Number(epoch.operator_revenue_sol ?? 0)
          }
        ]
      : []),
    ...input.winners
      .filter((winner) => winner.walletAddress && winner.prizeSol > 0)
      .map((winner) => ({
        payout_batch_id: batch.id,
        epoch_id: epoch.id,
        ranking_id: winner.rankingId,
        agent_id: winner.agentId,
        item_key: `rank_${winner.rank}`,
        item_type: "prize_payout" as const,
        rank: winner.rank,
        recipient_wallet_address: winner.walletAddress,
        recipient_name: winner.agentName,
        amount_sol: winner.prizeSol
      }))
  ];

  const items = await insertPayoutItems(client, itemPayload);
  return {
    batch,
    items,
    created: true
  };
}
