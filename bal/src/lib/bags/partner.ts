import { PublicKey } from "@solana/web3.js";
import { DEFAULT_PARTNER_CONFIG_PDA } from "@/lib/constants";
import { getBagsSDK } from "@/lib/bags/sdk";

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getClaimableAmount(value: unknown) {
  if (!value || typeof value !== "object") {
    return 0;
  }

  const record = value as Record<string, unknown>;
  return readNumber(record.claimableAmount ?? record.claimable_amount ?? record.amount);
}

export const BAL_PARTNER_CONFIG_PDA = process.env.BAL_PARTNER_CONFIG_PDA ?? DEFAULT_PARTNER_CONFIG_PDA;
export const BAL_FEE_ACCOUNT = process.env.BAL_PARTNER_WALLET ?? "";

export async function getPartnerFeeBalance() {
  const sdk = getBagsSDK();
  if (!sdk || !BAL_FEE_ACCOUNT) {
    return 0;
  }

  const positions = await sdk.fee.getAllClaimablePositions(new PublicKey(BAL_FEE_ACCOUNT));
  return positions.reduce((sum, position) => sum + getClaimableAmount(position), 0);
}

export async function getWeeklyFeeTotal(startDate: string, endDate: string) {
  void startDate;
  void endDate;
  return getPartnerFeeBalance();
}
