"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { EpochSummary } from "@/types";
import { Button } from "@/components/ui/button";

export function EpochSelector({
  currentEpochId,
  epochs
}: {
  currentEpochId: string;
  epochs: EpochSummary[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const index = epochs.findIndex((epoch) => epoch.id === currentEpochId);

  function navigate(offset: number) {
    const target = epochs[index + offset];
    if (!target) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("epoch", target.id);
    router.push(`/leaderboard?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => navigate(1)} disabled={index >= epochs.length - 1}>
        Prev
      </Button>
      <Button variant="outline" onClick={() => navigate(-1)} disabled={index <= 0}>
        Next
      </Button>
    </div>
  );
}

