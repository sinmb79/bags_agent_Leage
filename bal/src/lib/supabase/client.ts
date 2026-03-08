"use client";

import { createBrowserClient } from "@supabase/ssr";
import { hasEnvValue } from "@/lib/env";

export function createBrowserSupabase() {
  if (!hasEnvValue("NEXT_PUBLIC_SUPABASE_URL") || !hasEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    return null;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
