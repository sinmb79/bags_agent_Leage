"use client";

import { useEffect } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const wallets = [
  new PhantomWalletAdapter(),
  new BackpackWalletAdapter(),
  new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet })
];

function WalletConnectInner({ onAddressChange }: { onAddressChange?: (address: string) => void }) {
  const { publicKey } = useWallet();

  useEffect(() => {
    onAddressChange?.(publicKey?.toBase58() ?? "");
  }, [onAddressChange, publicKey]);

  return <WalletMultiButton className="!rounded-full !bg-slate-900 hover:!bg-slate-800" />;
}

export function WalletConnect({ onAddressChange }: { onAddressChange?: (address: string) => void }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletConnectInner onAddressChange={onAddressChange} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
