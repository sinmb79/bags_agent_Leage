import { readFileSync } from "node:fs";
import { Keypair, VersionedTransaction, Connection } from "@solana/web3.js";

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function loadKeypair() {
  const raw = readFileSync(requireEnv("SOLANA_KEYPAIR_PATH"), "utf8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
}

export async function fetchTokenList() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/v1/tokens`);
  const payload = (await response.json()) as { success: boolean; data?: Array<{ mint: string; symbol: string }> };
  return payload.data ?? [];
}

export async function registerDemoAgent(name: string, walletAddress: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await fetch(`${baseUrl}/api/v1/agents/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      wallet_address: walletAddress
    })
  });
}

export async function executeJupiterSwap({
  inputMint,
  outputMint,
  amountLamports
}: {
  inputMint: string;
  outputMint: string;
  amountLamports: number;
}) {
  const keypair = loadKeypair();
  const connection = new Connection(requireEnv("SOLANA_RPC_URL"), "confirmed");

  const quoteUrl = new URL("https://quote-api.jup.ag/v6/quote");
  quoteUrl.searchParams.set("inputMint", inputMint);
  quoteUrl.searchParams.set("outputMint", outputMint);
  quoteUrl.searchParams.set("amount", String(amountLamports));
  quoteUrl.searchParams.set("slippageBps", "100");
  quoteUrl.searchParams.set("platformFeeBps", "10");

  const quote = await fetch(quoteUrl).then((response) => response.json());
  const swap = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: keypair.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      feeAccount: requireEnv("BAL_PARTNER_WALLET")
    })
  }).then((response) => response.json());

  const transaction = VersionedTransaction.deserialize(
    Buffer.from(swap.swapTransaction as string, "base64")
  );
  transaction.sign([keypair]);

  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false
  });
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}
