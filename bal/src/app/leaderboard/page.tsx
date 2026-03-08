import { CountdownTimer } from "@/components/leaderboard/CountdownTimer";
import { EpochSelector } from "@/components/leaderboard/EpochSelector";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { Card } from "@/components/ui/card";
import { getAllEpochs, getCurrentEpoch, getLeaderboard } from "@/lib/app-data";
import { formatDateRange, formatSol } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams?: { epoch?: string };
}) {
  const epochs = await getAllEpochs();
  const activeEpoch = await getCurrentEpoch();
  const currentEpoch = epochs.find((epoch) => epoch.id === searchParams?.epoch) ?? activeEpoch;
  const entries = await getLeaderboard(currentEpoch.id);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900">
                Epoch {currentEpoch.epochNumber}
              </h1>
              <EpochSelector currentEpochId={currentEpoch.id} epochs={epochs} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {formatDateRange(currentEpoch.weekStart, currentEpoch.weekEnd)}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ends In</div>
              <div className="mt-2">
                <CountdownTimer targetDate={currentEpoch.weekEnd} />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Prize Pool</div>
              <div className="mt-2 text-3xl font-bold text-green-600">{formatSol(currentEpoch.prizePoolSol)} SOL</div>
            </div>
          </div>
        </div>
      </Card>

      <LeaderboardTable epochId={currentEpoch.id} initialEntries={entries} />
    </div>
  );
}

