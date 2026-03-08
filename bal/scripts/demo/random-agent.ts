import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { executeJupiterSwap, fetchTokenList, loadKeypair, registerDemoAgent, sleep } from "./shared";
import { SOL_MINT } from "../../src/lib/constants";

async function main() {
  const keypair = loadKeypair();
  await registerDemoAgent("BAL Random Agent", keypair.publicKey.toBase58());

  while (true) {
    const tokens = await fetchTokenList();
    const candidate = tokens[Math.floor(Math.random() * tokens.length)];

    if (candidate) {
      console.log(`Random buy ${candidate.symbol}`);
      const signature = await executeJupiterSwap({
        inputMint: SOL_MINT,
        outputMint: candidate.mint,
        amountLamports: Math.round((0.01 + Math.random() * 0.04) * LAMPORTS_PER_SOL)
      });
      console.log(`Swap signature: ${signature}`);
    }

    await sleep(10 * 60 * 1000);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

