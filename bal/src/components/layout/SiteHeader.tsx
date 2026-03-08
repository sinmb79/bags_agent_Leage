import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavBar } from "@/components/layout/NavBar";

export function SiteHeader() {
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

