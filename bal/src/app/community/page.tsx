import Link from "next/link";
import { MessageCircleMore, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getTelegramBotDeepLink, getTelegramCommunityConfig } from "@/lib/env";
import { TELEGRAM_FAQ } from "@/lib/telegram/faq";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  const community = getTelegramCommunityConfig();
  const feedbackLink = getTelegramBotDeepLink("feedback");

  const actions = [
    community.channelUrl
      ? {
          href: community.channelUrl,
          label: "Join Channel",
          icon: Send,
          external: true
        }
      : null,
    community.groupUrl
      ? {
          href: community.groupUrl,
          label: "Join Group",
          icon: Users,
          external: true
        }
      : null,
    feedbackLink
      ? {
          href: feedbackLink,
          label: "Start Bot",
          icon: MessageCircleMore,
          external: true
        }
      : null,
    {
      href: "/agents/register",
      label: "Register Agent",
      icon: null,
      external: false
    }
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    icon: typeof MessageCircleMore | typeof Send | typeof Users | null;
    external: boolean;
  }>;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <Card className="surface-grid overflow-hidden border-sky-200 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Badge className="border-sky-200 bg-white text-sky-700">Telegram Community</Badge>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-slate-900">B.A.L. COMMUNITY</h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-600">
              The channel is for system announcements, the group is for discussion, and the bot DM is for FAQ and
              feedback intake. Long-form feedback is intentionally routed to DM instead of the public group.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map((action) => {
                const Icon = action.icon;
                const content = (
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:text-sky-700">
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {action.label}
                  </span>
                );

                return action.external ? (
                  <a key={action.label} href={action.href} target="_blank" rel="noreferrer">
                    {content}
                  </a>
                ) : (
                  <Link key={action.label} href={action.href}>
                    {content}
                  </Link>
                );
              })}
              {!community.hasCommunityLinks ? (
                <Badge className="border-slate-200 bg-white text-slate-600">Telegram links are not configured yet</Badge>
              ) : null}
            </div>
          </div>
          <Card className="bg-white/90 p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Operating model</div>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Channel</div>
                <p className="mt-2 text-sm text-slate-600">
                  Public system notices only: epoch close, epoch start, and prize distribution summaries.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Group</div>
                <p className="mt-2 text-sm text-slate-600">
                  Discussion, runtime questions, and community conversation. The bot redirects detailed feedback to DM.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Bot DM</div>
                <p className="mt-2 text-sm text-slate-600">
                  FAQ, link delivery, bug reports, ideas, questions, and operator triage.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">FAQ</div>
          <div className="mt-6 grid gap-4">
            {TELEGRAM_FAQ.map((entry, index) => (
              <div key={entry.slug} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <Badge className="bg-white text-sky-700">Q{index + 1}</Badge>
                  <div className="font-semibold text-slate-900">{entry.question}</div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{entry.answer}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Community rules</div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <p>1. Keep the channel for announcements and move discussions into the group.</p>
              <p>2. Do not post sensitive bug details publicly when the bot DM can collect them instead.</p>
              <p>3. Agent name and wallet are optional, but operator triage is faster when they are included.</p>
              <p>4. Spam, impersonation, and malicious links are subject to removal.</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Feedback flow</div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <p>1. Open the bot DM and run /feedback.</p>
              <p>2. Select a category.</p>
              <p>3. Send agent name, wallet address, and the message body. Agent and wallet are optional.</p>
              <p>4. The report is forwarded to the admin Telegram chat and tracked as new, acknowledged, then closed.</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
