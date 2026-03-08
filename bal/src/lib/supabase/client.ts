"use client";

import { createBrowserClient } from "@supabase/ssr";
import { hasEnvValue } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createBrowserSupabase() {
  if (!hasEnvValue("NEXT_PUBLIC_SUPABASE_URL") || !hasEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    return null;
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
