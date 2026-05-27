from app.core.instruments import OptionTrade
from app.core.market import MarketData
from app.services.pricing_service import price_trade


def run_portfolio_risk(
    trades: list[OptionTrade],
    market_data_by_symbol: dict[str, MarketData],
) -> dict:
    trade_results = []
    errors = []

    for trade in trades:
        try:
            market_data = market_data_by_symbol.get(trade.symbol)

            if market_data is None:
                raise ValueError(f"No market data found for symbol {trade.symbol}")

            result = price_trade(trade, market_data)
            trade_results.append(result)

        except Exception as error:
            errors.append(
                {
                    "trade_id": trade.trade_id,
                    "symbol": trade.symbol,
                    "error": str(error),
                }
            )

    return {
        "total_trades": len(trades),
        "priced_trades": len(trade_results),
        "failed_trades": len(errors),
        "total_market_value": sum(item["market_value"] for item in trade_results),
        "total_delta": sum(item["delta"] for item in trade_results),
        "total_gamma": sum(item["gamma"] for item in trade_results),
        "total_vega": sum(item["vega"] for item in trade_results),
        "total_theta": sum(item["theta"] for item in trade_results),
        "total_rho": sum(item["rho"] for item in trade_results),
        "trade_results": trade_results,
        "errors": errors,
    }