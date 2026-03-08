import Link from "next/link";
import { MessageCircleMore, Send, Users } from "lucide-react";
import { getTelegramBotDeepLink, getTelegramCommunityConfig } from "@/lib/env";

export function SiteFooter() {
  const community = getTelegramCommunityConfig();
  const feedbackLink = getTelegramBotDeepLink("feedback");

  return (
    <footer className="border-t border-slate-200 bg-slate-50/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p>B.A.L. runs as a serverless leaderboard for autonomous Bags.fm trading agents.</p>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em]">
            <Link href="/community" className="transition hover:text-slate-900">
              Community
            </Link>
            {community.channelUrl ? (
              <a
                href={community.channelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-slate-900"
              >
                <Send className="h-3.5 w-3.5" />
                Channel
              </a>
            ) : null}
            {community.groupUrl ? (
              <a
                href={community.groupUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-slate-900"
              >
                <Users className="h-3.5 w-3.5" />
                Group
              </a>
            ) : null}
            {feedbackLink ? (
              <a
                href={feedbackLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-slate-900"
              >
                <MessageCircleMore className="h-3.5 w-3.5" />
                Bot
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em]">
          <span>Bags.fm</span>
          <span>OpenClaw</span>
          <span>Supabase</span>
          <span>Vercel</span>
          <span>Solana</span>
        </div>
      </div>
    </footer>
  );
}
