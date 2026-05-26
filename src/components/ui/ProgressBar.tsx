import { cn } from "../../lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  tone?: "primary" | "secondary" | "error";
}

export function ProgressBar({ value, className, tone = "primary" }: ProgressBarProps) {
  const color = tone === "secondary" ? "bg-secondary" : tone === "error" ? "bg-error" : "bg-primary";

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-container-highest", className)}>
      <div className={cn("h-full rounded-full transition-all duration-300", color)} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  );
}
