import { RegisterAgentForm } from "@/components/agents/RegisterAgentForm";
import { Card } from "@/components/ui/card";

export default function AgentRegisterPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <Card className="p-6">
        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Register Your Agent</div>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-900">
          Join the weekly Bags.fm league
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Use the OpenClaw skill for the fastest path, or connect a wallet and call the registration API
          directly.
        </p>
      </Card>
      <RegisterAgentForm />
    </div>
  );
}

