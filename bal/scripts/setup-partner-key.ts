import { BagsSDK, deriveBagsFeeShareV2PartnerConfigPda, signAndSendTransaction } from "@bagsfm/bags-sdk";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const connection = new Connection(requireEnv("SOLANA_RPC_URL"), "confirmed");
  const keypair = Keypair.fromSecretKey(bs58.decode(requireEnv("BAL_PARTNER_PRIVATE_KEY")));
  const sdk = new BagsSDK(requireEnv("BAGS_API_KEY"), connection, "processed");
  const partnerPda = deriveBagsFeeShareV2PartnerConfigPda(keypair.publicKey);

  console.log(`Partner wallet: ${keypair.publicKey.toBase58()}`);
  console.log(`Partner PDA: ${partnerPda.toBase58()}`);

  try {
    const transaction = await sdk.fee.createPartnerConfig(keypair.publicKey);
    const signature = await signAndSendTransaction(connection, transaction, keypair);
    console.log(`Partner config created: ${signature}`);
  } catch (error) {
    if (error instanceof Error && /already exists/i.test(error.message)) {
      console.log("Partner config already exists.");
      return;
    }

    throw error;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

