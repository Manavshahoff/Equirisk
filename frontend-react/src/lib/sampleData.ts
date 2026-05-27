import type { Trade, MarketData } from "@/types/equirisk";

export const defaultTrades: Trade[] = [
  {
    trade_id: "T001",
    book: "EQD",
    symbol: "AAPL",
    product_type: "european_option",
    option_type: "call",
    quantity: 100,
    strike: 105,
    expiry: "2027-05-20",
    pricing_model: "black_scholes",
  },
  {
    trade_id: "T002",
    book: "EQD",
    symbol: "AAPL",
    product_type: "european_option",
    option_type: "put",
    quantity: 50,
    strike: 95,
    expiry: "2027-05-20",
    pricing_model: "black_scholes",
  },
  {
    trade_id: "T003",
    book: "EQD",
    symbol: "MSFT",
    product_type: "european_option",
    option_type: "call",
    quantity: 75,
    strike: 420,
    expiry: "2027-05-20",
    pricing_model: "black_scholes",
  },
];

export const defaultMarketData: MarketData[] = [
  { symbol: "AAPL", spot: 100, rate: 0.05, volatility: 0.2, as_of_date: "2026-05-20" },
  { symbol: "MSFT", spot: 410, rate: 0.05, volatility: 0.25, as_of_date: "2026-05-20" },
];

export function newTrade(): Trade {
  return {
    trade_id: `T${String(Math.floor(Math.random() * 9000) + 1000)}`,
    book: "EQD",
    symbol: "AAPL",
    product_type: "european_option",
    option_type: "call",
    quantity: 100,
    strike: 100,
    expiry: "2027-05-20",
    pricing_model: "black_scholes",
  };
}

export function newMarketData(): MarketData {
  return { symbol: "AAPL", spot: 100, rate: 0.05, volatility: 0.2, as_of_date: "2026-05-20" };
}
