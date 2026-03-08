import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { executeJupiterSwap, fetchTokenList, loadKeypair, registerDemoAgent, sleep } from "./shared";
import { SOL_MINT } from "../../src/lib/constants";

async function main() {
  const keypair = loadKeypair();
  await registerDemoAgent("BAL Mean Reversion Agent", keypair.publicKey.toBase58());

  while (true) {
    const tokens = await fetchTokenList();
    const candidate = tokens[tokens.length - 1];

    if (candidate) {
      console.log(`Mean reversion buy ${candidate.symbol}`);
      const signature = await executeJupiterSwap({
        inputMint: SOL_MINT,
        outputMint: candidate.mint,
        amountLamports: Math.round(0.05 * LAMPORTS_PER_SOL)
      });
      console.log(`Swap signature: ${signature}`);
    }

    await sleep(30 * 60 * 1000);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

