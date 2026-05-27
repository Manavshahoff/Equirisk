import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "accent";
  icon?: ReactNode;
}

export function MetricCard({ label, value, hint, tone = "default", icon }: Props) {
  return (
    <Card className="bg-card/80 border-border/80 shadow-[var(--shadow-card)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div
          className={cn(
            "mt-2 text-2xl font-semibold tabular-nums tracking-tight",
            tone === "positive" && "text-positive",
            tone === "negative" && "text-negative",
            tone === "accent" && "text-accent",
          )}
        >
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export function formatNumber(v: number | undefined | null, digits = 4): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return v.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatCurrency(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "—";
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
