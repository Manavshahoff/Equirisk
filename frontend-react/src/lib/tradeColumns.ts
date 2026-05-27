import type { ColumnDef } from "@/components/EditableTable";
import type { MarketData, Trade } from "@/types/equirisk";

export const tradeColumns: ColumnDef<Trade>[] = [
  { key: "trade_id", label: "Trade ID" },
  { key: "book", label: "Book" },
  { key: "symbol", label: "Symbol" },
  {
    key: "product_type",
    label: "Product",
    type: "select",
    options: [{ value: "european_option", label: "European Option" }],
  },
  {
    key: "option_type",
    label: "Type",
    type: "select",
    options: [
      { value: "call", label: "Call" },
      { value: "put", label: "Put" },
    ],
  },
  { key: "quantity", label: "Qty", type: "number" },
  { key: "strike", label: "Strike", type: "number" },
  { key: "expiry", label: "Expiry", type: "date" },
  {
    key: "pricing_model",
    label: "Model",
    type: "select",
    options: [{ value: "black_scholes", label: "Black-Scholes" }, { value: "monte_carlo", label: "Monte Carlo" }],
  },
];

export const marketColumns: ColumnDef<MarketData>[] = [
  { key: "symbol", label: "Symbol" },
  { key: "spot", label: "Spot", type: "number" },
  { key: "rate", label: "Rate", type: "number" },
  { key: "volatility", label: "Vol", type: "number" },
  { key: "as_of_date", label: "As Of", type: "date" },
];
