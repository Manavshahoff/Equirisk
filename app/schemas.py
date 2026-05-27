from datetime import date
from pydantic import BaseModel, Field
from typing import List


class PriceTradeRequest(BaseModel):
    trade_id: str
    book: str
    symbol: str
    product_type: str
    option_type: str
    quantity: int
    strike: float
    expiry: date
    pricing_model: str

    spot: float
    rate: float
    volatility: float
    as_of_date: date


class PriceTradeResponse(BaseModel):
    trade_id: str
    book: str
    symbol: str
    product_type: str
    option_type: str
    pricing_model: str
    quantity: int

    unit_price: float
    market_value: float
    delta: float
    gamma: float
    vega: float
    theta: float
    rho: float

class TradeInput(BaseModel):
    trade_id: str
    book: str
    symbol: str
    product_type: str
    option_type: str
    quantity: int
    strike: float
    expiry: date
    pricing_model: str


class MarketDataInput(BaseModel):
    symbol: str
    spot: float
    rate: float
    volatility: float
    as_of_date: date

class RunRiskRequest(BaseModel):
    trades: List[TradeInput]
    market_data: List[MarketDataInput]


class RunRiskResponse(BaseModel):
    run_id: str

    total_trades: int
    priced_trades: int
    failed_trades: int

    total_market_value: float
    total_delta: float
    total_gamma: float
    total_vega: float
    total_theta: float
    total_rho: float

    trade_results: list[PriceTradeResponse]
    errors: list[dict]

class ScenarioInput(BaseModel):
    name: str
    spot_shock: float = 0.0
    volatility_shock: float = 0.0
    rate_shock: float = 0.0


class ScenarioRiskRequest(BaseModel):
    trades: list[TradeInput]
    market_data: list[MarketDataInput]
    scenario: ScenarioInput


class ScenarioTradeResult(BaseModel):
    trade_id: str
    symbol: str
    base_market_value: float
    shocked_market_value: float
    pnl: float


class ScenarioRiskResponse(BaseModel):
    scenario_name: str
    total_trades: int
    base_portfolio_value: float
    shocked_portfolio_value: float
    portfolio_pnl: float
    trade_results: list[ScenarioTradeResult]
    errors: list[dict]

class MarketQuoteResponse(BaseModel):
    symbol: str
    open: float
    high: float
    low: float
    price: float
    volume: int
    latest_trading_day: str
    previous_close: float
    change: float
    change_percent: str
    source: str | None = None
    reason: str | None = None

class UserCreate(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=72)


class UserLogin(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=72)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SavedTradeCreate(BaseModel):
    trade_id: str
    book: str
    symbol: str
    product_type: str
    option_type: str
    quantity: int
    strike: float
    expiry: str
    pricing_model: str


class SavedTradeResponse(SavedTradeCreate):
    id: int