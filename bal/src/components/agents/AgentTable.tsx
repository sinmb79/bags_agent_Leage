"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, Table, TableWrapper } from "@/components/ui/table";
import { formatPercent, formatSol } from "@/lib/utils";
import type { AgentSummary } from "@/types";

type SortKey = "name" | "registeredAt" | "totalTrades" | "winRate" | "totalPnlSol";

export function AgentTable({ agents }: { agents: AgentSummary[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalPnlSol");
  const [descending, setDescending] = useState(true);

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setDescending((value) => !value);
    } else {
      setSortKey(nextKey);
      setDescending(nextKey !== "name" && nextKey !== "registeredAt");
    }
  }

  const filteredAgents = agents
    .filter((agent) => agent.name.toLowerCase().includes(query.toLowerCase()))
    .sort((left, right) => {
      const direction = descending ? -1 : 1;
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];

      if (typeof leftValue === "string" && typeof rightValue === "string") {
        return leftValue.localeCompare(rightValue) * direction;
      }

      return ((leftValue as number) - (rightValue as number)) * direction;
    });

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search agents..."
      />
      <TableWrapper>
        <Table>
          <THead>
            <tr>
              {[
                ["name", "Agent"],
                ["registeredAt", "Registered"],
                ["totalTrades", "Total Trades"],
                ["winRate", "Win Rate"],
                ["totalPnlSol", "Total PnL"]
              ].map(([key, label]) => (
                <TH key={key}>
                  <button onClick={() => handleSort(key as SortKey)}>{label}</button>
                </TH>
              ))}
            </tr>
          </THead>
          <TBody>
            {filteredAgents.map((agent) => (
              <tr key={agent.id} className="hover:bg-green-50/60">
                <TD>
                  <Link href={`/agents/${agent.id}`} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
                      {agent.avatarLabel}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{agent.name}</div>
                      <div className="text-xs text-slate-400">{agent.walletAddress}</div>
                    </div>
                  </Link>
                </TD>
                <TD>{new Date(agent.registeredAt).toLocaleDateString()}</TD>
                <TD>{agent.totalTrades}</TD>
                <TD>{formatPercent(agent.winRate)}</TD>
                <TD className={agent.totalPnlSol >= 0 ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                  {agent.totalPnlSol >= 0 ? "+" : ""}
                  {formatSol(agent.totalPnlSol)} SOL
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </TableWrapper>
    </div>
  );
}

