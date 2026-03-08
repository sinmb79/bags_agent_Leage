import { TokenTable } from "@/components/tokens/TokenTable";
import { Card } from "@/components/ui/card";
import { getTokenMarket } from "@/lib/app-data";

export const dynamic = "force-dynamic";

export default async function TokensPage() {
  const tokens = await getTokenMarket();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Card className="p-6">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Token Market</div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-900">
          Live Bags.fm token prices
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Bags token watchlist with prices, changes, and simple momentum snapshots. Data refreshes every 30
          seconds.
        </p>
      </Card>
      <TokenTable initialTokens={tokens} />
    </div>
  );
}

