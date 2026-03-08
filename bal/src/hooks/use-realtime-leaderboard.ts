"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/types";

export function useRealtimeLeaderboard(epochId: string, initialEntries: LeaderboardEntry[]) {
  const [entries, setEntries] = useState(initialEntries);

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      return;
    }

    async function refresh() {
      const response = await fetch(`/api/v1/leaderboard?epochId=${encodeURIComponent(epochId)}`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as { success: boolean; data?: LeaderboardEntry[] };
      if (payload.success && payload.data) {
        setEntries(payload.data);
      }
    }

    const channel = supabase
      .channel(`rankings-${epochId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rankings",
          filter: `epoch_id=eq.${epochId}`
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [epochId]);

  return entries;
}

