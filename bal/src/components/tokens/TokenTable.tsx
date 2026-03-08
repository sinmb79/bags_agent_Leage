"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "@/components/charts/Sparkline";
import { TBody, TD, TH, THead, Table, TableWrapper } from "@/components/ui/table";
import { formatPercent } from "@/lib/utils";
import type { TokenData } from "@/types";

export function TokenTable({ initialTokens }: { initialTokens: TokenData[] }) {
  const [tokens, setTokens] = useState(initialTokens);

  useEffect(() => {
    setTokens(initialTokens);
  }, [initialTokens]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const response = await fetch("/api/v1/tokens", { cache: "no-store" });
      const payload = (await response.json()) as { success: boolean; data?: TokenData[] };
      if (payload.success && payload.data) {
        setTokens(payload.data);
      }
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <TableWrapper>
      <Table>
        <THead>
          <tr>
            <TH>Token</TH>
            <TH>Price (USD)</TH>
            <TH>24h Change</TH>
            <TH>24h Volume</TH>
            <TH>Market Cap</TH>
            <TH>Momentum</TH>
          </tr>
        </THead>
        <TBody>
          {tokens.map((token) => (
            <tr
              key={token.mint}
              className="cursor-pointer hover:bg-green-50/60"
              onClick={() => window.open(token.bagsUrl, "_blank", "noopener,noreferrer")}
            >
              <TD>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                    {token.symbol.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{token.symbol}</div>
                    <div className="text-xs text-slate-400">{token.name}</div>
                  </div>
                </div>
              </TD>
              <TD>${token.priceUsd.toFixed(4)}</TD>
              <TD className={token.change24h >= 0 ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                {token.change24h >= 0 ? "+" : ""}
                {formatPercent(token.change24h)}
              </TD>
              <TD>${token.volume24h.toLocaleString()}</TD>
              <TD>${token.marketCap.toLocaleString()}</TD>
              <TD>
                <Sparkline
                  values={[0.1, 0.3, 0.35, 0.4, 0.6, 0.85, 1].map((value) => value * token.change24h)}
                  positive={token.change24h >= 0}
                />
              </TD>
            </tr>
          ))}
        </TBody>
      </Table>
    </TableWrapper>
  );
}

