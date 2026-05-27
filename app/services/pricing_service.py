from datetime import date

from app.core.instruments import OptionTrade
from app.core.market import MarketData
from app.pricing.black_scholes import BlackScholesInput, calculate_all
from app.pricing.monte_carlo import MonteCarloInput
from app.pricing.monte_carlo import price as monte_carlo_price


def calculate_time_to_maturity(expiry: date, as_of_date: date) -> float:
    days_to_expiry = (expiry - as_of_date).days

    if days_to_expiry < 0:
        raise ValueError("Trade expiry date cannot be before market data as-of date.")

    return days_to_expiry / 365.0


def price_trade(trade: OptionTrade, market_data: MarketData) -> dict:
    trade.validate()
    market_data.validate()

    if trade.symbol != market_data.symbol:
        raise ValueError("Trade symbol and market data symbol do not match.")

    if trade.pricing_model not in ("black_scholes", "monte_carlo"):
        raise ValueError("Only Black-Scholes and Monte Carlo pricing are supported right now.")

    time_to_maturity = calculate_time_to_maturity(
        expiry=trade.expiry,
        as_of_date=market_data.as_of_date,
    )

    if trade.pricing_model == "black_scholes":
        bs_input = BlackScholesInput(
            spot=market_data.spot,
            strike=trade.strike,
            rate=market_data.rate,
            volatility=market_data.volatility,
            time_to_maturity=time_to_maturity,
            option_type=trade.option_type,
        )

        result = calculate_all(bs_input)

    elif trade.pricing_model == "monte_carlo":
        mc_input = MonteCarloInput(
            spot=market_data.spot,
            strike=trade.strike,
            rate=market_data.rate,
            volatility=market_data.volatility,
            time_to_maturity=time_to_maturity,
            option_type=trade.option_type,
            simulations=10000,
            seed=42,
        )

        mc_price = monte_carlo_price(mc_input)

        result = {
            "price": mc_price,
            "delta": 0.0,
            "gamma": 0.0,
            "vega": 0.0,
            "theta": 0.0,
            "rho": 0.0,
        }

    return {
        "trade_id": trade.trade_id,
        "book": trade.book,
        "symbol": trade.symbol,
        "product_type": trade.product_type,
        "option_type": trade.option_type,
        "pricing_model": trade.pricing_model,
        "quantity": trade.quantity,
        "unit_price": result["price"],
        "market_value": result["price"] * trade.quantity,
        "delta": result["delta"] * trade.quantity,
        "gamma": result["gamma"] * trade.quantity,
        "vega": result["vega"] * trade.quantity,
        "theta": result["theta"] * trade.quantity,
        "rho": result["rho"] * trade.quantity,
    }    
    