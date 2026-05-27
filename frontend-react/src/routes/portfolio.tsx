import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Play, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard, formatCurrency, formatNumber } from "@/components/MetricCard";
import { EditableTable } from "@/components/EditableTable";
import { RiskBarChart } from "@/components/RiskChart";
import { JsonViewer } from "@/components/JsonViewer";

import {
  BackendUnreachableError,
  runRisk,
  getMarketQuote,
  getMyTrades,
  saveMyTrade,
  deleteMyTradeByTradeId,
} from "@/api/equiriskApi";

import type {
  MarketData,
  RunRiskResponse,
  Trade,
  TradeResult,
} from "@/types/equirisk";

import {
  defaultMarketData,
  defaultTrades,
  newMarketData,
  newTrade,
} from "@/lib/sampleData";

import { marketColumns, tradeColumns } from "@/lib/tradeColumns";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio Risk — EquiRisk" },
      {
        name: "description",
        content: "Run portfolio-level risk across multiple equity option trades.",
      },
    ],
  }),
  component: PortfolioRiskPage,
});

function downloadCSV(rows: TradeResult[]) {
  if (rows.length === 0) return;

  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));

  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h as keyof TradeResult];

          if (v === null || v === undefined) return "";

          const s = String(v).replaceAll('"', '""');

          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `portfolio-risk-${Date.now()}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

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

function uniqueTradesByTradeId(trades: Trade[]): Trade[] {
  const map = new Map<string, Trade>();

  for (const trade of trades) {
    map.set(trade.trade_id, trade);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.trade_id.localeCompare(b.trade_id),
  );
}

function PortfolioRiskPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  // (defaultTrades);
  const [market, setMarket] = useState<MarketData[]>([]);
  // (defaultMarketData);
  const [selectedT, setSelectedT] = useState<Set<number>>(new Set());
  const [selectedM, setSelectedM] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<RunRiskResponse | null>(null);

  useEffect(() => {
    const loadSavedTrades = async () => {
      const token = localStorage.getItem("equirisk_token");

      if (!token) {
        return;
      }

      try {
        const savedTrades = await getMyTrades();

        if (savedTrades.length > 0) {
          setTrades(uniqueTradesByTradeId(savedTrades));
          toast.success("Loaded your saved trades");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load saved trades",
        );
      }
    };

    loadSavedTrades();
  }, []);

  const saveCurrentPortfolio = async () => {
    const token = localStorage.getItem("equirisk_token");

    if (!token) {
      toast.error("Please login first to save your portfolio");
      return;
    }

    setSaving(true);

    try {
      await Promise.all(trades.map((trade) => saveMyTrade(trade)));

      toast.success("Portfolio saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save portfolio",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedSavedTrades = async () => {
  const token = localStorage.getItem("equirisk_token");

  if (!token) {
    toast.error("Please login first to delete saved trades");
    return;
  }

  const selectedIndexes = Array.from(selectedT);

  if (selectedIndexes.length === 0) {
    toast.error("Please select at least one trade to delete");
    return;
  }

  try {
    const selectedTrades = selectedIndexes
      .map((index) => trades[index])
      .filter(Boolean);

    await Promise.all(
      selectedTrades.map((trade) => deleteMyTradeByTradeId(trade.trade_id)),
    );

    setTrades((currentTrades) =>
      currentTrades.filter((_, index) => !selectedT.has(index)),
    );

    setSelectedT(new Set());

    toast.success("Selected trades deleted");
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to delete selected trades",
    );
  }
  };

  const removeSelectedTrades = async () => {
  const selectedIndexes = Array.from(selectedT);

  if (selectedIndexes.length === 0) {
    toast.error("Please select at least one trade to remove");
    return;
  }

  const selectedTrades = selectedIndexes
    .map((index) => trades[index])
    .filter(Boolean);

  const token = localStorage.getItem("equirisk_token");

  try {
    if (token) {
      await Promise.all(
        selectedTrades.map((trade) => deleteMyTradeByTradeId(trade.trade_id)),
      );
    }

    setTrades((currentTrades) =>
      currentTrades.filter((_, index) => !selectedT.has(index)),
    );

    setSelectedT(new Set());

    toast.success(
      token
        ? "Selected trades removed from saved portfolio"
        : "Selected trades removed from table",
    );
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to remove selected trades",
    );
  }
  };

  const submit = async () => {
    setLoading(true);

    try {
      const r = await runRisk({ trades, market_data: market });

      setResult(r);

      toast.success("Portfolio risk run complete", {
        description: `${r.priced_trades ?? r.trade_results?.length ?? 0} trades priced`,
      });
    } catch (e) {
      const msg =
        e instanceof BackendUnreachableError
          ? "FastAPI backend is not running on port 8000"
          : (e as Error).message;

      toast.error("Risk run failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPortfolioMarketData = async () => {
    try {
      const uniqueSymbols = Array.from(
        new Set(trades.map((trade) => trade.symbol).filter(Boolean)),
      );

      if (uniqueSymbols.length === 0) {
        toast.error("Please add at least one trade symbol first");
        return;
      }

      const quotes = await Promise.all(
        uniqueSymbols.map((symbol) => getMarketQuote(symbol)),
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
        error instanceof Error ? error.message : "Failed to fetch live market data",
      );
    }
  };

  const tradeResults: TradeResult[] = result?.trade_results ?? result?.results ?? [];

  const chartData = tradeResults.map((r) => ({
    symbol: r.symbol,
    market_value: r.market_value ?? 0,
    delta: r.delta ?? 0,
    vega: r.vega ?? 0,
    theta: r.theta ?? 0,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Portfolio Risk</h2>
        <p className="text-sm text-muted-foreground">
          Compute market value and Greeks across a portfolio of equity option trades.
        </p>
      </div>

      <Card className="bg-card/80 border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Trades</CardTitle>
        </CardHeader>

        <CardContent>
          <EditableTable
            rows={trades}
            columns={tradeColumns}
            selected={selectedT}
            onSelectedChange={setSelectedT}
            onChange={setTrades}
            newRow={() => ({
              ...newTrade(),
              trade_id: getNextTradeId(trades),
            })}
            addLabel="Add Trade Row"
            onRemoveSelected={removeSelectedTrades}

          />
        </CardContent>
      </Card>

      <Card className="bg-card/80 border-border/80">
        <CardHeader>
          <CardTitle className="text-base">Market Data</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleFetchPortfolioMarketData}
          >
            Fetch Live Market Data
          </Button>

          <EditableTable
            rows={market}
            columns={marketColumns}
            selected={selectedM}
            onSelectedChange={setSelectedM}
            onChange={setMarket}
            newRow={newMarketData}
            addLabel="Add Market Row"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 justify-end">
        <Button
          variant="secondary"
          onClick={saveCurrentPortfolio}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Portfolio
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => downloadCSV(tradeResults)}
          disabled={tradeResults.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" /> Download Results CSV
        </Button>

        <Button onClick={submit} disabled={loading} className="gap-2 min-w-48">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Running risk…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Run Portfolio Risk
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-6">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Portfolio Summary
              {result.run_id && (
                <span className="ml-2 text-muted-foreground/70 normal-case">
                  · Run ID {result.run_id}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <MetricCard
                label="Total Trades"
                value={result.total_trades ?? tradeResults.length}
              />

              <MetricCard
                label="Priced"
                value={result.priced_trades ?? "—"}
                tone="positive"
              />

              <MetricCard
                label="Failed"
                value={result.failed_trades ?? 0}
                tone={(result.failed_trades ?? 0) > 0 ? "negative" : "default"}
              />

              <MetricCard
                label="Total Market Value"
                value={formatCurrency(result.total_market_value)}
                tone="accent"
              />

              <MetricCard
                label="Total Delta"
                value={formatNumber(result.total_delta, 4)}
              />

              <MetricCard
                label="Total Gamma"
                value={formatNumber(result.total_gamma, 6)}
              />

              <MetricCard
                label="Total Vega"
                value={formatNumber(result.total_vega, 4)}
              />

              <MetricCard
                label="Total Theta"
                value={formatNumber(result.total_theta, 4)}
              />

              <MetricCard
                label="Total Rho"
                value={formatNumber(result.total_rho, 4)}
              />
            </div>
          </div>

          {tradeResults.length > 0 && (
            <>
              <Card className="bg-card/80 border-border/80">
                <CardHeader>
                  <CardTitle className="text-base">Trade-Level Results</CardTitle>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary/40">
                      <tr className="text-left">
                        {[
                          "Trade ID",
                          "Symbol",
                          "Unit Price",
                          "Market Value",
                          "Delta",
                          "Gamma",
                          "Vega",
                          "Theta",
                          "Rho",
                          "Status",
                        ].map((h) => (
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
                      {tradeResults.map((r) => (
                        <tr
                          key={r.trade_id}
                          className="border-t border-border hover:bg-secondary/20"
                        >
                          <td className="px-3 py-2 font-medium">{r.trade_id}</td>
                          <td className="px-3 py-2">{r.symbol ?? "—"}</td>
                          <td className="px-3 py-2">
                            {formatNumber(r.unit_price, 4)}
                          </td>
                          <td className="px-3 py-2">
                            {formatCurrency(r.market_value)}
                          </td>
                          <td className="px-3 py-2">{formatNumber(r.delta, 4)}</td>
                          <td className="px-3 py-2">{formatNumber(r.gamma, 6)}</td>
                          <td className="px-3 py-2">{formatNumber(r.vega, 4)}</td>
                          <td className="px-3 py-2">{formatNumber(r.theta, 4)}</td>
                          <td className="px-3 py-2">{formatNumber(r.rho, 4)}</td>
                          <td className="px-3 py-2">
                            <span
                              className={
                                r.error ? "text-negative" : "text-positive"
                              }
                            >
                              {r.error ? "Failed" : r.status ?? "OK"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RiskBarChart
                  title="Market Value by Trade"
                  data={chartData.map((d) => ({
                    symbol: d.symbol,
                    value: d.market_value,
                  }))}
                  colorVar="var(--chart-1)"
                  signed
                />

                <RiskBarChart
                  title="Delta by Trade"
                  data={chartData.map((d) => ({
                    symbol: d.symbol,
                    value: d.delta,
                  }))}
                  signed
                />

                <RiskBarChart
                  title="Vega by Trade"
                  data={chartData.map((d) => ({
                    symbol: d.symbol,
                    value: d.vega,
                  }))}
                  colorVar="var(--chart-4)"
                  signed
                />

                <RiskBarChart
                  title="Theta by Trade"
                  data={chartData.map((d) => ({
                    symbol: d.symbol,
                    value: d.theta,
                  }))}
                  signed
                />
              </div>
            </>
          )}

          <JsonViewer data={result} />
        </div>
      )}
    </div>
  );
}