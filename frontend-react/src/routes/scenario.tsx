import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard, formatCurrency } from "@/components/MetricCard";
import { EditableTable } from "@/components/EditableTable";
import { BaseVsShockedChart, RiskBarChart } from "@/components/RiskChart";
import { JsonViewer } from "@/components/JsonViewer";
import { BackendUnreachableError, scenarioRisk, getMarketQuote } from "@/api/equiriskApi";
import type {
  MarketData,
  Scenario,
  ScenarioResponse,
  ScenarioTradeResult,
  Trade,
} from "@/types/equirisk";
import {
  defaultMarketData,
  defaultTrades,
  newMarketData,
  newTrade,
} from "@/lib/sampleData";
import { marketColumns, tradeColumns } from "@/lib/tradeColumns";

export const Route = createFileRoute("/scenario")({
  head: () => ({
    meta: [
      { title: "Scenario Risk — EquiRisk" },
      {
        name: "description",
        content: "Apply spot, vol, and rate shocks to your portfolio and inspect PnL.",
      },
    ],
  }),
  component: ScenarioRiskPage,
});

const initialScenario: Scenario = {
  name: "Equity Down 5 Percent",
  spot_shock: -0.05,
  volatility_shock: 0.1,
  rate_shock: 0.01,
};

function getNextTradeId(trades: Trade[]): string {
  const maxNumber = trades.reduce((max, trade) => {
    const match = trade.trade_id.match(/^T(\d+)$/);

    if (!match) {
      return max;
    }

    const number = Number(match[1]);
    return number > max ? number : max;
  }, 0);

  const nextNumber = maxNumber + 1;

  return `T${String(nextNumber).padStart(3, "0")}`;
}

function ScenarioRiskPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  // (defaultTrades);
  const [market, setMarket] = useState<MarketData[]>([]);
  // (defaultMarketData);
  const [selT, setSelT] = useState<Set<number>>(new Set());
  const [selM, setSelM] = useState<Set<number>>(new Set());
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResponse | null>(null);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await scenarioRisk({ trades, market_data: market, scenario });
      setResult(r);
      toast.success("Scenario complete", { description: scenario.name });
    } catch (e) {
      const msg =
        e instanceof BackendUnreachableError
          ? "FastAPI backend is not running on port 8000"
          : (e as Error).message;
      toast.error("Scenario failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };
  const handleFetchScenarioMarketData = async () => {
  try {
    const uniqueSymbols = Array.from(
      new Set(trades.map((trade) => trade.symbol).filter(Boolean))
    );

    if (uniqueSymbols.length === 0) {
      toast.error("Please add at least one trade symbol first");
      return;
    }

    const quotes = await Promise.all(
      uniqueSymbols.map((symbol) => getMarketQuote(symbol))
    );

    const liveMarketData = quotes.map((quote) => ({
      symbol: quote.symbol,
      spot: quote.price,
      rate: 0.05,
      volatility: 0.2,
      as_of_date: quote.latest_trading_day,
    }));

    setMarket(liveMarketData);

    toast.success("Live market data fetched successfully");
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to fetch live market data"
    );
  }
};

  const tradeResults: ScenarioTradeResult[] = result?.trade_results ?? result?.results ?? [];
  const pnlData = tradeResults.map((r) => ({ symbol: r.symbol, value: r.pnl ?? 0 }));
  const bvsData = tradeResults.map((r) => ({
    symbol: r.symbol,
    base: r.base_market_value ?? 0,
    shocked: r.shocked_market_value ?? 0,
  }));

  const pnl = result?.portfolio_pnl;
  const pnlTone: "positive" | "negative" | "default" =
    pnl === undefined ? "default" : pnl >= 0 ? "positive" : "negative";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Scenario Risk</h2>
        <p className="text-sm text-muted-foreground">
          Shock the market and measure portfolio PnL impact across all trades.
        </p>
      </div>

      <Card className="bg-card/80 border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Scenario Shocks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Scenario Name
              </Label>
              <Input
                value={scenario.name}
                onChange={(e) => setScenario({ ...scenario, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Spot Shock
              </Label>
              <Input
                type="number"
                step="0.01"
                value={scenario.spot_shock}
                onChange={(e) => setScenario({ ...scenario, spot_shock: Number(e.target.value) })}
              />
              <p className="text-[10px] text-muted-foreground">e.g. -0.05 for -5%</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Volatility Shock
              </Label>
              <Input
                type="number"
                step="0.01"
                value={scenario.volatility_shock}
                onChange={(e) =>
                  setScenario({ ...scenario, volatility_shock: Number(e.target.value) })
                }
              />
              <p className="text-[10px] text-muted-foreground">Additive shift in vol</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Rate Shock
              </Label>
              <Input
                type="number"
                step="0.001"
                value={scenario.rate_shock}
                onChange={(e) => setScenario({ ...scenario, rate_shock: Number(e.target.value) })}
              />
              <p className="text-[10px] text-muted-foreground">Additive shift in rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/80 border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableTable
            rows={trades}
            columns={tradeColumns}
            selected={selT}
            onSelectedChange={setSelT}
            onChange={setTrades}
            newRow={() => ({
              ...newTrade(),
              trade_id: getNextTradeId(trades),
            })}            
            addLabel="Add Trade Row"
          />
        </CardContent>
      </Card>

      <Card className="bg-card/80 border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Market Data</CardTitle>
        </CardHeader>
        <Button
          type="button"
          variant="secondary"
          onClick={handleFetchScenarioMarketData}
        >
          Fetch Live Market Data
        </Button>
        <CardContent>
          <EditableTable
            rows={market}
            columns={marketColumns}
            selected={selM}
            onSelectedChange={setSelM}
            onChange={setMarket}
            newRow={newMarketData}
            addLabel="Add Market Row"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={loading} className="gap-2 min-w-48">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Running scenario…
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" /> Run Scenario
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <MetricCard label="Scenario" value={result.scenario_name ?? scenario.name} />
            <MetricCard
              label="Base Portfolio Value"
              value={formatCurrency(result.base_portfolio_value)}
            />
            <MetricCard
              label="Shocked Portfolio Value"
              value={formatCurrency(result.shocked_portfolio_value)}
              tone="accent"
            />
            <MetricCard label="Portfolio PnL" value={formatCurrency(pnl)} tone={pnlTone} />
          </div>

          {tradeResults.length > 0 && (
            <>
              <Card className="bg-card/80 border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">Trade-Level Scenario Results</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary/40">
                      <tr className="text-left">
                        {["Trade ID", "Symbol", "Base MV", "Shocked MV", "PnL"].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2 font-medium text-muted-foreground uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {tradeResults.map((r) => {
                        const p = r.pnl ?? 0;
                        return (
                          <tr
                            key={r.trade_id}
                            className="border-t border-border hover:bg-secondary/20"
                          >
                            <td className="px-3 py-2 font-medium">{r.trade_id}</td>
                            <td className="px-3 py-2">{r.symbol ?? "—"}</td>
                            <td className="px-3 py-2">{formatCurrency(r.base_market_value)}</td>
                            <td className="px-3 py-2">
                              {formatCurrency(r.shocked_market_value)}
                            </td>
                            <td
                              className={`px-3 py-2 font-medium ${
                                p >= 0 ? "text-positive" : "text-negative"
                              }`}
                            >
                              {formatCurrency(r.pnl)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RiskBarChart title="PnL by Trade" data={pnlData} signed />
                <BaseVsShockedChart title="Base vs Shocked Market Value" data={bvsData} />
              </div>
            </>
          )}

          {/* <JsonViewer data={result} /> */}
        </div>
      )}
    </div>
  );
}
