from dataclasses import dataclass
from datetime import date
from typing import Literal


OptionType = Literal["call", "put"]
ProductType = Literal[
    "european_option",
    "american_option",
    "asian_option",
    "barrier_option",
]
PricingModel = Literal[
    "black_scholes",
    "binomial",
    "monte_carlo",
]


@dataclass(frozen=True)
class OptionTrade:
    trade_id: str
    book: str
    symbol: str
    product_type: ProductType
    option_type: OptionType
    quantity: int
    strike: float
    expiry: date
    pricing_model: PricingModel

    def validate(self) -> None:
        if not self.trade_id:
            raise ValueError("Trade ID is required.")

        if not self.book:
            raise ValueError("Book is required.")

        if not self.symbol:
            raise ValueError("Symbol is required.")

        if self.quantity == 0:
            raise ValueError("Quantity cannot be zero.")

        if self.strike <= 0:
            raise ValueError("Strike must be greater than 0.")

        if self.product_type not in (
            "european_option",
            "american_option",
            "asian_option",
            "barrier_option",
        ):
            raise ValueError("Invalid product type.")

        if self.option_type not in ("call", "put"):
            raise ValueError("Option type must be either 'call' or 'put'.")

        if self.pricing_model not in (
            "black_scholes",
            "binomial",
            "monte_carlo",
        ):
            raise ValueError("Invalid pricing model.")

        if (
            self.product_type == "american_option"
            and self.pricing_model == "black_scholes"
        ):
            raise ValueError(
                "American options should not use Black-Scholes because early exercise matters."
            )