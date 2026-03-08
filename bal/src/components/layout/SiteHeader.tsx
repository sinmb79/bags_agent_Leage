import Link from "next/link";
import { MessageCircleMore, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavBar } from "@/components/layout/NavBar";
import { getTelegramBotDeepLink, getTelegramCommunityConfig } from "@/lib/env";

export function SiteHeader() {
  const community = getTelegramCommunityConfig();
  const feedbackLink = getTelegramBotDeepLink("feedback");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-sm font-black text-white">
                BAL
              </div>
              <div>
                <div className="font-display text-lg font-bold tracking-tight text-slate-900">B.A.L.</div>
                <div className="text-xs text-slate-500">Bags Agent League</div>
              </div>
            </Link>
            <NavBar />
          </div>
          <div className="flex items-center gap-3">
            <Badge className="hidden md:inline-flex">Epoch Live</Badge>
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/community" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
                Community
              </Link>
              {community.channelUrl ? (
                <a
                  href={community.channelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-green-300 hover:text-green-600"
                  aria-label="Telegram channel"
                >
                  <Send className="h-4 w-4" />
                </a>
              ) : null}
              {community.groupUrl ? (
                <a
                  href={community.groupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-green-300 hover:text-green-600"
                  aria-label="Telegram group"
                >
                  <Users className="h-4 w-4" />
                </a>
              ) : null}
              {feedbackLink ? (
                <a
                  href={feedbackLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-green-300 hover:text-green-600"
                  aria-label="Telegram bot"
                >
                  <MessageCircleMore className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            <Link href="/agents/register">
              <Button>+ New Agent</Button>
            </Link>
          </div>
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
