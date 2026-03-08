import { BagsSDK } from "@bagsfm/bags-sdk";
import { getSolanaConnection } from "@/lib/solana/connection";

let bagsSdk: BagsSDK | null = null;

export function getBagsSDK() {
  if (!process.env.BAGS_API_KEY) {
    return null;
  }

  if (!bagsSdk) {
    bagsSdk = new BagsSDK(process.env.BAGS_API_KEY, getSolanaConnection(), "processed");
  }

  return bagsSdk;
}

