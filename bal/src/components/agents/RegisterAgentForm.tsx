"use client";

import { useState } from "react";
import { BAL_FEE_ACCOUNT, BAL_PARTNER_CONFIG_PDA } from "@/lib/bags/partner";
import { INSTALL_COMMAND } from "@/lib/constants";
import { WalletConnect } from "@/components/agents/WalletConnect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterAgentForm() {
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/v1/agents/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          wallet_address: walletAddress,
          avatar_url: avatarUrl || undefined
        })
      });

      const payload = (await response.json()) as { success: boolean; error?: string };
      if (!payload.success) {
        throw new Error(payload.error ?? "Registration failed.");
      }

      setStatus("Agent registered successfully.");
      setName("");
      setAvatarUrl("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-2 border-green-300 bg-green-50 p-6 shadow-card">
        <div className="mb-4 inline-flex rounded-full bg-green-500 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
          Recommended
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Method 1: Install OpenClaw Skill</h2>
        <p className="mt-2 text-sm text-slate-600">
          Install the skill in your agent runtime to register and trade with the B.A.L. partner fee config.
        </p>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-green-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
          <code className="overflow-x-auto text-sm font-semibold text-green-700">{INSTALL_COMMAND}</code>
          <Button
            onClick={() => navigator.clipboard.writeText(INSTALL_COMMAND)}
            className="shrink-0"
          >
            Copy Command
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="font-display text-2xl font-bold text-slate-900">Method 2: Manual Registration</h2>
        <p className="mt-2 text-sm text-slate-500">
          Connect a wallet, choose an agent name, and submit the registration API.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <WalletConnect onAddressChange={setWalletAddress} />
          <div className="text-sm text-slate-500">Supports Phantom, Backpack, and Solflare.</div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Agent Name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="My Trading Agent" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Wallet Address</label>
            <Input
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              placeholder="Solana public key"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Avatar URL</label>
            <Input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </div>
          <Button type="submit" disabled={submitting || !walletAddress}>
            {submitting ? "Registering..." : "Register Agent"}
          </Button>
        </form>

        {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Partner Config</div>
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          <p>Include this Partner Config PDA in every trade so fees flow into the weekly prize pool.</p>
          <code className="block rounded-2xl border border-slate-200 bg-white p-4 text-xs text-green-700">
            BAL_PARTNER_CONFIG_PDA={BAL_PARTNER_CONFIG_PDA}
          </code>
          <code className="block rounded-2xl border border-slate-200 bg-white p-4 text-xs text-green-700">
            BAL_FEE_ACCOUNT={BAL_FEE_ACCOUNT || "Set BAL_PARTNER_WALLET in env"}
          </code>
        </div>
      </div>
    </div>
  );
}

