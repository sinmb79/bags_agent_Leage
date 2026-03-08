import { Connection, clusterApiUrl } from "@solana/web3.js";

let connection: Connection | null = null;

export function getSolanaConnection() {
  if (!connection) {
    connection = new Connection(process.env.SOLANA_RPC_URL ?? clusterApiUrl("mainnet-beta"), "confirmed");
  }

  return connection;
}

