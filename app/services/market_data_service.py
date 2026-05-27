from datetime import datetime, timezone

import requests

from app.config import settings


FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote"


def fetch_latest_quote(symbol: str) -> dict:
    symbol = symbol.upper()

    if not settings.finnhub_api_key:
        raise ValueError("FINNHUB_API_KEY is missing in .env file.")

    params = {
        "symbol": symbol,
        "token": settings.finnhub_api_key,
    }

    response = requests.get(
        FINNHUB_QUOTE_URL,
        params=params,
        timeout=10,
    )

    response.raise_for_status()
    data = response.json()

    current_price = data.get("c")
    high_price = data.get("h")
    low_price = data.get("l")
    open_price = data.get("o")
    previous_close = data.get("pc")
    timestamp = data.get("t")

    if current_price is None or current_price == 0:
        raise ValueError(f"No live quote returned for symbol {symbol}.")

    latest_time = (
        datetime.fromtimestamp(timestamp, tz=timezone.utc).date().isoformat()
        if timestamp
        else datetime.now(timezone.utc).date().isoformat()
    )

    change = current_price - previous_close if previous_close else 0.0

    change_percent = (
        f"{(change / previous_close) * 100:.2f}%"
        if previous_close
        else "0%"
    )

    return {
        "symbol": symbol,
        "open": float(open_price or current_price),
        "high": float(high_price or current_price),
        "low": float(low_price or current_price),
        "price": float(current_price),
        "volume": 0,
        "latest_trading_day": latest_time,
        "previous_close": float(previous_close or current_price),
        "change": float(change),
        "change_percent": change_percent,
        "source": "finnhub",
        "reason": None,
    }