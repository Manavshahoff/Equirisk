import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SingleSeriesProps {
  title: string;
  data: { symbol: string; value: number }[];
  colorVar?: string;
  signed?: boolean;
}

const tooltipStyle = {
  backgroundColor: "oklch(0.22 0.018 250)",
  border: "1px solid oklch(0.32 0.018 255)",
  borderRadius: 8,
  fontSize: 12,
  color: "oklch(0.96 0.005 250)",
} as const;

export function RiskBarChart({
  title,
  data,
  colorVar = "var(--chart-1)",
  signed = false,
}: SingleSeriesProps) {
  return (
    <Card className="bg-card/80 border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="oklch(0.32 0.018 255)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="symbol" stroke="oklch(0.7 0.02 255)" fontSize={11} />
            <YAxis stroke="oklch(0.7 0.02 255)" fontSize={11} tickFormatter={(v) => Number(v).toLocaleString()} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "oklch(0.28 0.02 255 / 40%)" }}
              formatter={(v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    signed
                      ? d.value >= 0
                        ? "var(--positive)"
                        : "var(--negative)"
                      : colorVar
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DualProps {
  title: string;
  data: { symbol: string; base: number; shocked: number }[];
}

export function BaseVsShockedChart({ title, data }: DualProps) {
  return (
    <Card className="bg-card/80 border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="oklch(0.32 0.018 255)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="symbol" stroke="oklch(0.7 0.02 255)" fontSize={11} />
            <YAxis stroke="oklch(0.7 0.02 255)" fontSize={11} tickFormatter={(v) => Number(v).toLocaleString()} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.28 0.02 255 / 40%)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="base" name="Base" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="shocked" name="Shocked" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
