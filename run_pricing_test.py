from datetime import date

from app.core.instruments import OptionTrade
from app.core.market import MarketData
from app.services.pricing_service import price_trade


trade = OptionTrade(
    trade_id="T001",
    book="EQD",
    symbol="AAPL",
    product_type="european_option",
    option_type="call",
    quantity=100,
    strike=105,
    expiry=date(2027, 5, 20),
    pricing_model="black_scholes",
)

market_data = MarketData(
    symbol="AAPL",
    spot=100,
    rate=0.05,
    volatility=0.20,
    as_of_date=date(2026, 5, 20),
)

result = price_trade(trade, market_data)

for key, value in result.items():
    print(f"{key}: {value}")