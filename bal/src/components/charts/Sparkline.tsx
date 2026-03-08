import { cn } from "@/lib/utils";

export function Sparkline({ values, positive = true, className }: { values: number[]; positive?: boolean; className?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const path = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 96;
      const y = 32 - ((value - min) / range) * 32;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 96 32" className={cn("h-8 w-24", className)} fill="none">
      <path
        d={path}
        stroke={positive ? "#16a34a" : "#dc2626"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

