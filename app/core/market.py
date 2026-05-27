from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class MarketData:
    symbol: str
    spot: float
    rate: float
    volatility: float
    as_of_date: date

    def validate(self) -> None:
        if not self.symbol:
            raise ValueError("Symbol is required.")

        if self.spot <= 0:
            raise ValueError("Spot price must be greater than 0.")

        if self.volatility < 0:
            raise ValueError("Volatility cannot be negative.")

        if self.as_of_date is None:
            raise ValueError("As-of date is required.")