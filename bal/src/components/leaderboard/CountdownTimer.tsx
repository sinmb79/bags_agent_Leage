"use client";

import { useEffect, useState } from "react";

function getRemainingParts(targetDate: string) {
  const difference = new Date(targetDate).getTime() - Date.now();
  const safeDifference = Math.max(difference, 0);

  return {
    days: Math.floor(safeDifference / 86_400_000),
    hours: Math.floor((safeDifference % 86_400_000) / 3_600_000),
    minutes: Math.floor((safeDifference % 3_600_000) / 60_000),
    seconds: Math.floor((safeDifference % 60_000) / 1000)
  };
}

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState(() => getRemainingParts(targetDate));

  useEffect(() => {
    setRemaining(getRemainingParts(targetDate));
    const interval = window.setInterval(() => {
      setRemaining(getRemainingParts(targetDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="font-mono text-sm font-semibold text-slate-900">
      {remaining.days}D {String(remaining.hours).padStart(2, "0")}H{" "}
      {String(remaining.minutes).padStart(2, "0")}M {String(remaining.seconds).padStart(2, "0")}S
    </div>
  );
}

