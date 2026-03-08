"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm md:flex">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

