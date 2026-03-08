"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkline } from "@/components/charts/Sparkline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TBody, TD, TH, THead, Table, TableWrapper } from "@/components/ui/table";
import { useRealtimeLeaderboard } from "@/hooks/use-realtime-leaderboard";
import { cn, formatPercent, formatSol } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

type SortKey =
  | "rank"
  | "agentName"
  | "pnlSol"
  | "sharpeRatio"
  | "maxDrawdown"
  | "compositeScore"
  | "estimatedPrizeSol";

export function LeaderboardTable({
  epochId,
  initialEntries
}: {
  epochId: string;
  initialEntries: LeaderboardEntry[];
}) {
  const entries = useRealtimeLeaderboard(epochId, initialEntries);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [descending, setDescending] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 50;

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setDescending((value) => !value);
    } else {
      setSortKey(nextKey);
      setDescending(nextKey !== "rank" && nextKey !== "agentName");
    }
  }

  const sortedEntries = [...entries].sort((left, right) => {
    const leftValue = left[sortKey];
    const rightValue = right[sortKey];
    const direction = descending ? -1 : 1;

    if (typeof leftValue === "string" && typeof rightValue === "string") {
      return leftValue.localeCompare(rightValue) * direction;
    }

    return ((leftValue as number) - (rightValue as number)) * direction;
  });

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / perPage));
  const pageEntries = sortedEntries.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <TableWrapper>
        <Table>
          <THead>
            <tr>
              {[
                ["rank", "Rank"],
                ["agentName", "Agent"],
                ["pnlSol", "Epoch PnL"],
                ["sharpeRatio", "Sharpe"],
                ["maxDrawdown", "Max DD"],
                ["compositeScore", "Score"],
                ["estimatedPrizeSol", "Prize"]
              ].map(([key, label]) => (
                <TH key={key}>
                  <button
                    className="inline-flex items-center gap-2 hover:text-slate-900"
                    onClick={() => handleSort(key as SortKey)}
                  >
                    {label}
                    {sortKey === key ? <span>{descending ? "v" : "^"}</span> : null}
                  </button>
                </TH>
              ))}
              <TH>Trend</TH>
            </tr>
          </THead>
          <TBody>
            {pageEntries.map((entry) => (
              <tr key={entry.agentId} className="hover:bg-green-50/60">
                <TD>
                  <Badge
                    className={cn(
                      "border-transparent",
                      entry.rank === 1 && "bg-amber-100 text-amber-700",
                      entry.rank === 2 && "bg-slate-200 text-slate-700",
                      entry.rank === 3 && "bg-orange-100 text-orange-700",
                      entry.rank > 3 && "bg-slate-100 text-slate-500"
                    )}
                  >
                    #{entry.rank}
                  </Badge>
                </TD>
                <TD>
                  <Link href={`/agents/${entry.agentId}`} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                      {entry.avatarLabel}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{entry.agentName}</div>
                      <div className="text-xs text-slate-400">{entry.trades} trades</div>
                    </div>
                  </Link>
                </TD>
                <TD className={entry.pnlSol >= 0 ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                  {entry.pnlSol >= 0 ? "+" : ""}
                  {formatSol(entry.pnlSol)} SOL
                </TD>
                <TD>{entry.sharpeRatio.toFixed(2)}</TD>
                <TD className="text-red-500">{formatPercent(entry.maxDrawdown)}</TD>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${Math.max(0, Math.min(entry.compositeScore, 100))}%` }}
                      />
                    </div>
                    <span className="font-semibold text-slate-900">{entry.compositeScore.toFixed(1)}</span>
                  </div>
                </TD>
                <TD className="font-semibold text-slate-900">
                  {entry.estimatedPrizeSol > 0 ? `${formatSol(entry.estimatedPrizeSol)} SOL` : "-"}
                </TD>
                <TD>
                  <Sparkline values={entry.trend} positive={entry.pnlSol >= 0} />
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </TableWrapper>
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
            Prev
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

