import { PublicKey, Transaction, type Connection, type Keypair } from "@solana/web3.js";
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

function roundSol(value: number) {
  return Number(value.toFixed(8));
}

async function signAndConfirmTransaction(connection: Connection, keypair: Keypair, transaction: Transaction) {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  transaction.feePayer = keypair.publicKey;
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.sign(keypair);

  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    },
    "confirmed"
  );

  return signature;
}

export const BAL_PARTNER_CONFIG_PDA = process.env.BAL_PARTNER_CONFIG_PDA ?? DEFAULT_PARTNER_CONFIG_PDA;
export const BAL_FEE_ACCOUNT = process.env.BAL_PARTNER_WALLET ?? "";

export async function getPartnerClaimablePositions() {
  const sdk = getBagsSDK();
  if (!sdk || !BAL_FEE_ACCOUNT) {
    return [];
  }

  return sdk.fee.getAllClaimablePositions(new PublicKey(BAL_FEE_ACCOUNT));
}

export async function getPartnerFeeBalance() {
  const positions = await getPartnerClaimablePositions();
  return positions.reduce((sum, position) => sum + getClaimableAmount(position), 0);
}

export async function getWeeklyFeeTotal(startDate: string, endDate: string) {
  void startDate;
  void endDate;
  return getPartnerFeeBalance();
}

export async function claimPartnerFees(connection: Connection, keypair: Keypair) {
  const sdk = getBagsSDK();
  if (!sdk || !BAL_FEE_ACCOUNT) {
    return {
      claimedAmountSol: 0,
      signatures: [] as string[],
      positionsClaimed: 0
    };
  }

  const wallet = new PublicKey(BAL_FEE_ACCOUNT);
  const positions = await sdk.fee.getAllClaimablePositions(wallet);
  const signatures: string[] = [];
  let claimedAmountSol = 0;
  let positionsClaimed = 0;

  for (const position of positions) {
    const claimableAmount = getClaimableAmount(position);
    if (claimableAmount <= 0) {
      continue;
    }

    const claimTransactions = await sdk.fee.getClaimTransaction(wallet, position);
    for (const transaction of claimTransactions) {
      const signature = await signAndConfirmTransaction(connection, keypair, transaction);
      signatures.push(signature);
    }

    claimedAmountSol += claimableAmount;
    positionsClaimed += 1;
  }

  return {
    claimedAmountSol: roundSol(claimedAmountSol),
    signatures,
    positionsClaimed
  };
}
