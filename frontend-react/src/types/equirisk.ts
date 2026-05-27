export type ProductType = "european_option";
export type OptionType = "call" | "put";
export type PricingModel = "black_scholes" | "monte_carlo";

export interface Trade {
  trade_id: string;
  book: string;
  symbol: string;
  product_type: ProductType;
  option_type: OptionType;
  quantity: number;
  strike: number;
  expiry: string;
  pricing_model: PricingModel;
}

export interface MarketData {
  symbol: string;
  spot: number;
  rate: number;
  volatility: number;
  as_of_date: string;
}

export interface SingleTradeRequest extends Trade {
  spot: number;
  rate: number;
  volatility: number;
  as_of_date: string;
}

export interface Greeks {
  delta?: number;
  gamma?: number;
  vega?: number;
  theta?: number;
  rho?: number;
}

export interface PriceTradeResponse {
  trade_id?: string;
  unit_price?: number;
  market_value?: number;
  delta?: number;
  gamma?: number;
  vega?: number;
  theta?: number;
  rho?: number;
  [k: string]: unknown;
}

export interface RunRiskRequest {
  trades: Trade[];
  market_data: MarketData[];
}

export interface TradeResult {
  trade_id: string;
  symbol: string;
  unit_price?: number;
  market_value?: number;
  delta?: number;
  gamma?: number;
  vega?: number;
  theta?: number;
  rho?: number;
  status?: string;
  error?: string;
  [k: string]: unknown;
}

export interface RunRiskResponse {
  run_id?: string;
  total_trades?: number;
  priced_trades?: number;
  failed_trades?: number;
  total_market_value?: number;
  total_delta?: number;
  total_gamma?: number;
  total_vega?: number;
  total_theta?: number;
  total_rho?: number;
  trade_results?: TradeResult[];
  results?: TradeResult[];
  [k: string]: unknown;
}

export interface Scenario {
  name: string;
  spot_shock: number;
  volatility_shock: number;
  rate_shock: number;
}

export interface ScenarioRequest {
  trades: Trade[];
  market_data: MarketData[];
  scenario: Scenario;
}

export interface ScenarioTradeResult {
  trade_id: string;
  symbol: string;
  base_market_value?: number;
  shocked_market_value?: number;
  pnl?: number;
  [k: string]: unknown;
}

export interface ScenarioResponse {
  scenario_name?: string;
  base_portfolio_value?: number;
  shocked_portfolio_value?: number;
  portfolio_pnl?: number;
  trade_results?: ScenarioTradeResult[];
  results?: ScenarioTradeResult[];
  [k: string]: unknown;
}
