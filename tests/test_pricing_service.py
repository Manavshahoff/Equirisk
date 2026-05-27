from datetime import date

import pytest

from app.core.instruments import OptionTrade
from app.core.market import MarketData
from app.services.pricing_service import calculate_time_to_maturity, price_trade


def test_calculate_time_to_maturity():
    expiry = date(2027, 5, 20)
    as_of_date = date(2026, 5, 20)

    result = calculate_time_to_maturity(expiry, as_of_date)

    assert round(result, 4) == 1.0


def test_price_trade_with_black_scholes():
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

    assert result["trade_id"] == "T001"
    assert result["book"] == "EQD"
    assert result["symbol"] == "AAPL"
    assert round(result["unit_price"], 4) == 8.0214
    assert round(result["market_value"], 4) == 802.1352
    assert "delta" in result
    assert "gamma" in result
    assert "vega" in result
    assert "theta" in result
    assert "rho" in result


def test_price_trade_rejects_symbol_mismatch():
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
        symbol="MSFT",
        spot=100,
        rate=0.05,
        volatility=0.20,
        as_of_date=date(2026, 5, 20),
    )

    with pytest.raises(ValueError, match="symbol"):
        price_trade(trade, market_data)


def test_price_trade_rejects_expired_trade():
    trade = OptionTrade(
        trade_id="T001",
        book="EQD",
        symbol="AAPL",
        product_type="european_option",
        option_type="call",
        quantity=100,
        strike=105,
        expiry=date(2025, 5, 20),
        pricing_model="black_scholes",
    )

    market_data = MarketData(
        symbol="AAPL",
        spot=100,
        rate=0.05,
        volatility=0.20,
        as_of_date=date(2026, 5, 20),
    )

    with pytest.raises(ValueError, match="expiry"):
        price_trade(trade, market_data)