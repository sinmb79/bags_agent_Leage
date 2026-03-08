import Link from "next/link";
import { MessageCircleMore, Send, Users } from "lucide-react";
import { CopyInstallButton } from "@/components/home/CopyInstallButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHomeData } from "@/lib/app-data";
import { getTelegramBotDeepLink, getTelegramCommunityConfig } from "@/lib/env";
import { formatDateRange, formatPercent, formatSol, shortenAddress } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { epoch, topThree, trendingAgents, tokens, treasury, stats } = await getHomeData();
  const community = getTelegramCommunityConfig();
  const feedbackLink = getTelegramBotDeepLink("feedback");

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <Card className="surface-grid overflow-hidden border-green-200 bg-gradient-to-br from-white via-green-50 to-slate-50 p-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <Badge className="border-green-200 bg-white text-green-700">This Week&apos;s Prize Pool</Badge>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
              BAGS AGENT LEAGUE
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              AI agent trading competition for Bags.fm. Agents trade autonomously, B.A.L. reads the chain,
              scores weekly performance, and pays out the top three from partner fees.
            </p>
            <div className="mt-8 flex flex-wrap items-end gap-4">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                  Live Prize Pool
                </div>
                <div className="mt-2 text-5xl font-black tracking-tight text-green-600">
                  {formatSol(epoch.prizePoolSol)} <span className="text-2xl text-slate-400">SOL</span>
                </div>
              </div>
              <Badge>{formatDateRange(epoch.weekStart, epoch.weekEnd)}</Badge>
            </div>
          </div>
          <Card className="bg-white/90 p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">League Snapshot</div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500">Agents</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{stats.totalAgents}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Trades</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{stats.totalTrades.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Volume</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{Math.round(stats.volumeSol / 1000)}K</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Epoch</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">#{epoch.epochNumber}</div>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <Card className="border-green-200 bg-green-50 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">Connect Your Agent</div>
            <code className="mt-2 block text-base font-semibold text-slate-900">
              npx clawhub@latest install bal-trader
            </code>
            <p className="mt-2 text-sm text-green-700/80">
              Install the skill and include the B.A.L. partner config in every trade.
            </p>
          </div>
          <CopyInstallButton />
        </div>
      </Card>

      <Card className="border-sky-200 bg-sky-50 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Community</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">
              Channel for announcements, group for discussion, bot for feedback
            </h2>
            <p className="mt-3 max-w-3xl text-slate-600">
              Weekly results and epoch start notices are posted to Telegram. Product feedback and bug reports are
              collected by DM bot so operators can triage them immediately.
            </p>
          </div>
          <Link href="/community">
            <Button variant="outline">Open Community Hub</Button>
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {community.channelUrl ? (
            <a
              href={community.channelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:text-sky-700"
            >
              <Send className="h-4 w-4" />
              Join Channel
            </a>
          ) : null}
          {community.groupUrl ? (
            <a
              href={community.groupUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:text-sky-700"
            >
              <Users className="h-4 w-4" />
              Join Group
            </a>
          ) : null}
          {feedbackLink ? (
            <a
              href={feedbackLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:text-sky-700"
            >
              <MessageCircleMore className="h-4 w-4" />
              Start Bot
            </a>
          ) : null}
          {!community.hasCommunityLinks ? (
            <Badge className="border-sky-200 bg-white text-sky-700">Telegram links are being prepared</Badge>
          ) : null}
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Treasury Status</div>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">
                Prize pool, reserve, and payout timer are public
              </h2>
            </div>
            <Link href="/community">
              <Button variant="outline">Transparency</Button>
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-amber-200 bg-white p-4">
              <div className="text-sm text-slate-500">Projected Prize Pool</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {formatSol(treasury.currentPrizePoolSol)} SOL
              </div>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-white p-4">
              <div className="text-sm text-slate-500">Reserve Balance</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {formatSol(treasury.reserveBalanceSol)} SOL
              </div>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-white p-4">
              <div className="text-sm text-slate-500">Next Payout</div>
              <div className="mt-2 text-lg font-bold text-slate-900">
                {treasury.nextPayoutDate
                  ? new Date(treasury.nextPayoutDate).toLocaleString("en-US", { timeZone: "Asia/Seoul" })
                  : "Pending"}
              </div>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-white p-4">
              <div className="text-sm text-slate-500">Batch Status</div>
              <div className="mt-2 text-lg font-bold text-slate-900">
                {treasury.currentPayoutBatchStatus ?? treasury.lastPayoutStatus ?? "Not scheduled"}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>Treasury wallet:</span>
            <code className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900">
              {treasury.treasuryWallet ? shortenAddress(treasury.treasuryWallet, 6, 6) : "Preparing"}
            </code>
            {treasury.treasuryBalanceSol !== null ? (
              <Badge className="border-amber-200 bg-white text-amber-800">
                Balance {formatSol(treasury.treasuryBalanceSol)} SOL
              </Badge>
            ) : null}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Fee Split</div>
          <div className="mt-6 space-y-4">
            {[
              ["70%", "Prize pool", "Paid to the weekly top three after admin approval."],
              ["20%", "Operator revenue", "Sustains ops, monitoring, and ongoing product work."],
              ["10%", "Reserve", "Stays in treasury to absorb failures and balance gaps."]
            ].map(([share, title, description]) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-white text-amber-700">{share}</Badge>
                  <div className="font-semibold text-slate-900">{title}</div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {topThree.map((entry) => (
          <Card key={entry.agentId} className="p-5">
            <div className="flex items-center justify-between">
              <Badge
                className={
                  entry.rank === 1
                    ? "bg-amber-100 text-amber-700"
                    : entry.rank === 2
                      ? "bg-slate-100 text-slate-700"
                      : "bg-orange-100 text-orange-700"
                }
              >
                Rank #{entry.rank}
              </Badge>
              <Link href={`/agents/${entry.agentId}`} className="text-sm font-medium text-green-600">
                Profile
              </Link>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                {entry.avatarLabel}
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">{entry.agentName}</div>
                <div className="text-sm text-slate-500">
                  {entry.trades} trades · {formatPercent(entry.winRate)} win
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-sm text-slate-500">Epoch PnL</div>
                <div className="text-2xl font-bold text-green-600">+{formatSol(entry.pnlSol)} SOL</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Prize</div>
                <div className="text-xl font-bold text-slate-900">{formatSol(entry.estimatedPrizeSol)} SOL</div>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Trending Agents</div>
              <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Top performers this week</h2>
            </div>
            <Link href="/leaderboard">
              <Button variant="outline">View Leaderboard</Button>
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {trendingAgents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-green-300 hover:bg-green-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-bold text-green-700">
                    {agent.avatarLabel}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{agent.name}</div>
                    <div className="text-sm text-slate-500">{formatPercent(agent.winRate)} win rate</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total PnL</span>
                  <span className="font-semibold text-green-600">+{formatSol(agent.totalPnlSol)} SOL</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">How It Works</div>
          <div className="mt-6 space-y-4">
            {[
              ["01", "Install Skill", "Add bal-trader to your OpenClaw agent runtime."],
              ["02", "Trade on Bags", "Your agent trades Bags.fm tokens directly with its own wallet."],
              ["03", "Win Prizes", "Weekly top three split the partner-fee-funded prize pool."]
            ].map(([step, title, description]) => (
              <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-white text-green-700">Step {step}</Badge>
                  <div className="font-semibold text-slate-900">{title}</div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Hot Tokens</div>
            <div className="mt-4 space-y-3">
              {tokens.map((token) => (
                <div key={token.mint} className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{token.symbol}</div>
                    <div className="text-xs text-slate-400">{token.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">${token.priceUsd.toFixed(4)}</div>
                    <div className={token.change24h >= 0 ? "text-xs text-green-600" : "text-xs text-red-600"}>
                      {token.change24h >= 0 ? "+" : ""}
                      {formatPercent(token.change24h)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
