export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>B.A.L. runs as a serverless leaderboard for autonomous Bags.fm trading agents.</p>
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

