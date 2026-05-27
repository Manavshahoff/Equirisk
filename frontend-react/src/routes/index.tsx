import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MetricCard, formatNumber, formatCurrency } from "@/components/MetricCard";
import { JsonViewer } from "@/components/JsonViewer";
import { priceTrade, BackendUnreachableError, getMarketQuote } from "@/api/equiriskApi";
import type { PriceTradeResponse, SingleTradeRequest } from "@/types/equirisk";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Single Trade Pricing — EquiRisk" },
      {
        name: "description",
        content: "Price a single equity option trade with Black-Scholes and view Greeks.",
      },
    ],
  }),
  component: SingleTradePricingPage,
});

const initial: SingleTradeRequest = {
  trade_id: "T001",
  book: "EQD",
  symbol: "AAPL",
  product_type: "european_option",
  option_type: "call",
  quantity: 100,
  strike: 105,
  expiry: "2027-05-20",
  pricing_model: "black_scholes",
  spot: 100,
  rate: 0.05,
  volatility: 0.2,
  as_of_date: "2026-05-20",
};

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SingleTradePricingPage() {
  const [form, setForm] = useState<SingleTradeRequest>(initial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceTradeResponse | null>(null);

  const set = <K extends keyof SingleTradeRequest>(k: K, v: SingleTradeRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true);
    try {
      const r = await priceTrade(form);
      setResult(r);
      toast.success("Trade priced", { description: `Trade ${form.trade_id} priced successfully` });
    } catch (e) {
      const msg =
        e instanceof BackendUnreachableError
          ? "FastAPI backend is not running on port 8000"
          : (e as Error).message;
      toast.error("Pricing failed", { description: msg });
    } finally {
      setLoading(false);
    }

    
  };
  const handleFetchLiveSpot = async () => {
      if (!form.symbol) {
        toast.error("Please enter a symbol first");
        return;
      }

      try {
        const quote = await getMarketQuote(form.symbol);

        set("spot", quote.price);

        if (quote.latest_trading_day) {
          set("as_of_date", quote.latest_trading_day);
        }

        toast.success(`Fetched latest spot for ${quote.symbol}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch market data"
        );
      }
    };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Single Trade Pricing</h2>
        <p className="text-sm text-muted-foreground">
          Price a single equity derivative trade and inspect Greeks under the chosen pricing model.
        </p>
      </div>

      <Card className="bg-card/80 border-border/80 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-base">Trade & Market Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Trade
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="Trade ID">
                <Input value={form.trade_id} onChange={(e) => set("trade_id", e.target.value)} />
              </Field>
              <Field label="Book">
                <Input value={form.book} onChange={(e) => set("book", e.target.value)} />
              </Field>
              <Field label="Symbol">
                <Input value={form.symbol} onChange={(e) => set("symbol", e.target.value)} />
              </Field>
              <Field label="Product Type">
                <Select
                  value={form.product_type}
                  onValueChange={(v) => set("product_type", v as typeof form.product_type)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="european_option">European Option</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Option Type">
                <Select
                  value={form.option_type}
                  onValueChange={(v) => set("option_type", v as typeof form.option_type)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="put">Put</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Quantity">
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => set("quantity", Number(e.target.value))}
                />
              </Field>
              <Field label="Strike">
                <Input
                  type="number"
                  value={form.strike}
                  onChange={(e) => set("strike", Number(e.target.value))}
                />
              </Field>
              <Field label="Expiry">
                <Input
                  type="date"
                  value={form.expiry}
                  onChange={(e) => set("expiry", e.target.value)}
                />
              </Field>
              <Field label="Pricing Model">
                <Select
                  value={form.pricing_model}
                  onValueChange={(v) => set("pricing_model", v as typeof form.pricing_model)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="black_scholes">Black-Scholes</SelectItem>
                  
                  </SelectContent>
                  <SelectContent>
                    <SelectItem value="monte_carlo">Monte Carlo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Market Data
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Spot" hint="Current underlying price">
                <Input
                  type="number"
                  value={form.spot}
                  onChange={(e) => set("spot", Number(e.target.value))}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleFetchLiveSpot}
                  className="whitespace-nowrap"
                >
                  Fetch Live
                </Button>
              </Field>
              <Field label="Rate" hint="Risk-free rate (decimal)">
                <Input
                  type="number"
                  step="0.001"
                  value={form.rate}
                  onChange={(e) => set("rate", Number(e.target.value))}
                />
              </Field>
              <Field label="Volatility" hint="Annualized vol (decimal)">
                <Input
                  type="number"
                  step="0.01"
                  value={form.volatility}
                  onChange={(e) => set("volatility", Number(e.target.value))}
                />
              </Field>
              <Field label="As Of Date">
                <Input
                  type="date"
                  value={form.as_of_date}
                  onChange={(e) => set("as_of_date", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={submit} disabled={loading} className="gap-2 min-w-40">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Pricing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Price Trade
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pricing Result
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard label="Unit Price" value={formatNumber(result.unit_price, 4)} />
            <MetricCard
              label="Market Value"
              value={formatCurrency(result.market_value)}
              tone="accent"
            />
            <MetricCard label="Delta" value={formatNumber(result.delta, 4)} />
            <MetricCard label="Gamma" value={formatNumber(result.gamma, 6)} />
            <MetricCard label="Vega" value={formatNumber(result.vega, 4)} />
            <MetricCard label="Theta" value={formatNumber(result.theta, 4)} />
            <MetricCard label="Rho" value={formatNumber(result.rho, 4)} />
          </div>
          <JsonViewer data={result} />
        </div>
      )}
    </div>
  );
}
