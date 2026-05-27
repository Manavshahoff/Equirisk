from dataclasses import replace

from app.core.instruments import OptionTrade
from app.core.market import MarketData
from app.services.pricing_service import price_trade


def shock_market_data(
    market_data: MarketData,
    spot_shock: float,
    volatility_shock: float,
    rate_shock: float,
) -> MarketData:
    shocked_spot = market_data.spot * (1 + spot_shock)
    shocked_volatility = market_data.volatility * (1 + volatility_shock)
    shocked_rate = market_data.rate + rate_shock

    return replace(
        market_data,
        spot=shocked_spot,
        volatility=shocked_volatility,
        rate=shocked_rate,
    )


def run_scenario_risk(
    trades: list[OptionTrade],
    market_data_by_symbol: dict[str, MarketData],
    scenario_name: str,
    spot_shock: float,
    volatility_shock: float,
    rate_shock: float,
) -> dict:
    trade_results = []
    errors = []

    for trade in trades:
        try:
            base_market_data = market_data_by_symbol.get(trade.symbol)

            if base_market_data is None:
                raise ValueError(f"No market data found for symbol {trade.symbol}")

            shocked_market_data = shock_market_data(
                market_data=base_market_data,
                spot_shock=spot_shock,
                volatility_shock=volatility_shock,
                rate_shock=rate_shock,
            )

            base_result = price_trade(trade, base_market_data)
            shocked_result = price_trade(trade, shocked_market_data)

            base_value = base_result["market_value"]
            shocked_value = shocked_result["market_value"]

            trade_results.append(
                {
                    "trade_id": trade.trade_id,
                    "symbol": trade.symbol,
                    "base_market_value": base_value,
                    "shocked_market_value": shocked_value,
                    "pnl": shocked_value - base_value,
                }
            )

        except Exception as error:
            errors.append(
                {
                    "trade_id": trade.trade_id,
                    "symbol": trade.symbol,
                    "error": str(error),
                }
            )

    base_portfolio_value = sum(item["base_market_value"] for item in trade_results)
    shocked_portfolio_value = sum(item["shocked_market_value"] for item in trade_results)

    return {
        "scenario_name": scenario_name,
        "total_trades": len(trades),
        "base_portfolio_value": base_portfolio_value,
        "shocked_portfolio_value": shocked_portfolio_value,
        "portfolio_pnl": shocked_portfolio_value - base_portfolio_value,
        "trade_results": trade_results,
        "errors": errors,
    }