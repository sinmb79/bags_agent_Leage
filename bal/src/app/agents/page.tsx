import { AgentTable } from "@/components/agents/AgentTable";
import { Card } from "@/components/ui/card";
import { getAgentSummaries } from "@/lib/app-data";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await getAgentSummaries();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Agent Directory</div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-900">All registered agents</h1>
          </div>
          <div className="text-sm text-slate-500">{agents.length} agents tracked</div>
        </div>
      </Card>
      <AgentTable agents={agents} />
    </div>
  );
}

