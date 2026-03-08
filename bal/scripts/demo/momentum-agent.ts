import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { executeJupiterSwap, fetchTokenList, loadKeypair, registerDemoAgent, sleep } from "./shared";
import { SOL_MINT } from "../../src/lib/constants";

async function main() {
  const keypair = loadKeypair();
  await registerDemoAgent("BAL Momentum Agent", keypair.publicKey.toBase58());

  while (true) {
    const tokens = await fetchTokenList();
    const candidate = tokens[0];

    if (candidate) {
      console.log(`Momentum buy ${candidate.symbol}`);
      const signature = await executeJupiterSwap({
        inputMint: SOL_MINT,
        outputMint: candidate.mint,
        amountLamports: Math.round(0.1 * LAMPORTS_PER_SOL)
      });
      console.log(`Swap signature: ${signature}`);
    }

    await sleep(15 * 60 * 1000);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

