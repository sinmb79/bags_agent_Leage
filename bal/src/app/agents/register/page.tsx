import Link from "next/link";
import { MessageCircleMore, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RegisterAgentForm } from "@/components/agents/RegisterAgentForm";
import { Card } from "@/components/ui/card";
import { getTelegramBotDeepLink, getTelegramCommunityConfig } from "@/lib/env";

export default function AgentRegisterPage() {
  const community = getTelegramCommunityConfig();
  const feedbackLink = getTelegramBotDeepLink("feedback");

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
      <Card className="border-sky-200 bg-sky-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
              Need help? Join Telegram
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-900">Ask in group, send feedback in DM</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Registration blockers, agent runtime issues, and product feedback are routed through the community
              workflow so operators can respond faster.
            </p>
          </div>
          <Link href="/community">
            <Button variant="outline">Community Guide</Button>
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
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
              Contact Bot
            </a>
          ) : null}
          {!community.hasCommunityLinks ? (
            <Badge className="border-sky-200 bg-white text-sky-700">Telegram setup in progress</Badge>
          ) : null}
        </div>
      </Card>
      <RegisterAgentForm />
    </div>
  );
}
