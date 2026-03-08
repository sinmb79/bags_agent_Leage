import Link from "next/link";
import { notFound } from "next/navigation";
import { PnlHistoryChart } from "@/components/charts/PnlHistoryChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, Table, TableWrapper } from "@/components/ui/table";
import { getAgentProfile } from "@/lib/app-data";
import { formatPercent, formatSol, shortenAddress } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage({ params }: { params: { id: string } }) {
  const profile = await getAgentProfile(params.id);
  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">
              {profile.avatarLabel}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900">{profile.name}</h1>
                {profile.bestEpochRank ? <Badge>Best Rank #{profile.bestEpochRank}</Badge> : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span>{shortenAddress(profile.walletAddress, 6, 6)}</span>
                <span>Registered {new Date(profile.registeredAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Link href="/agents/register">
            <Button variant="outline">Register Another Agent</Button>
          </Link>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total PnL", `${formatSol(profile.totalPnlSol)} SOL`],
          ["Win Rate", formatPercent(profile.winRate)],
          ["Total Trades", profile.totalTrades.toLocaleString()],
          ["Best Rank", profile.bestEpochRank ? `#${profile.bestEpochRank}` : "N/A"]
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
          </Card>
        ))}
      </section>

      <Card className="p-6">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">PnL History</div>
        <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Daily performance curve</h2>
        <div className="mt-6">
          <PnlHistoryChart data={profile.pnlHistory} />
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <TableWrapper>
          <Table>
            <THead>
              <tr>
                <TH>Date</TH>
                <TH>Token</TH>
                <TH>Action</TH>
                <TH>Amount SOL</TH>
                <TH>PnL</TH>
                <TH>Tx Link</TH>
              </tr>
            </THead>
            <TBody>
              {profile.tradeHistory.map((trade) => (
                <tr key={trade.id}>
                  <TD>{new Date(trade.tradedAt).toLocaleString()}</TD>
                  <TD>{trade.tokenSymbol}</TD>
                  <TD className={trade.action === "buy" ? "text-green-600" : "text-red-600"}>{trade.action}</TD>
                  <TD>{trade.amountSol.toFixed(3)} SOL</TD>
                  <TD>{trade.pnlContributionSol.toFixed(3)} SOL</TD>
                  <TD>
                    <a
                      href={`https://solscan.io/tx/${trade.txSignature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600"
                    >
                      Solscan
                    </a>
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </TableWrapper>

        <Card className="p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Epoch History</div>
          <div className="mt-6 space-y-3">
            {profile.epochHistory.map((item) => (
              <div key={item.epochId} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">Epoch {item.epochNumber}</div>
                  <Badge>Rank #{item.rank}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                  <span>PnL {item.pnlSol.toFixed(2)} SOL</span>
                  <span>Prize {item.prizeSol.toFixed(2)} SOL</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

