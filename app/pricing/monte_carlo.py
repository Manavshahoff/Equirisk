import math
import random
from dataclasses import dataclass
from typing import Literal


OptionType = Literal["call", "put"]


@dataclass(frozen=True)
class MonteCarloInput:
    spot: float
    strike: float
    rate: float
    volatility: float
    time_to_maturity: float
    option_type: OptionType
    simulations: int = 10000
    seed: int | None = 42


def validate_inputs(inputs: MonteCarloInput) -> None:
    if inputs.spot <= 0:
        raise ValueError("Spot price must be greater than 0.")

    if inputs.strike <= 0:
        raise ValueError("Strike price must be greater than 0.")

    if inputs.volatility < 0:
        raise ValueError("Volatility cannot be negative.")

    if inputs.time_to_maturity < 0:
        raise ValueError("Time to maturity cannot be negative.")

    if inputs.option_type not in ("call", "put"):
        raise ValueError("Option type must be either 'call' or 'put'.")

    if inputs.simulations <= 0:
        raise ValueError("Simulations must be greater than 0.")


def calculate_payoff(final_price: float, strike: float, option_type: OptionType) -> float:
    if option_type == "call":
        return max(final_price - strike, 0.0)

    return max(strike - final_price, 0.0)


def price(inputs: MonteCarloInput) -> float:
    """
    Prices a European option using Monte Carlo simulation.

    Formula:
    S_T = S_0 * exp((r - 0.5 * sigma^2)T + sigma * sqrt(T) * Z)

    Then:
    option price = discounted average payoff
    """
    validate_inputs(inputs)

    if inputs.time_to_maturity == 0:
        return calculate_payoff(
            final_price=inputs.spot,
            strike=inputs.strike,
            option_type=inputs.option_type,
        )

    if inputs.seed is not None:
        random.seed(inputs.seed)

    payoffs = []

    drift = (
        inputs.rate - 0.5 * inputs.volatility**2
    ) * inputs.time_to_maturity

    diffusion_scale = inputs.volatility * math.sqrt(inputs.time_to_maturity)

    for _ in range(inputs.simulations):
        z = random.gauss(0.0, 1.0)

        final_price = inputs.spot * math.exp(
            drift + diffusion_scale * z
        )

        payoff = calculate_payoff(
            final_price=final_price,
            strike=inputs.strike,
            option_type=inputs.option_type,
        )

        payoffs.append(payoff)

    average_payoff = sum(payoffs) / inputs.simulations
    discounted_price = math.exp(-inputs.rate * inputs.time_to_maturity) * average_payoff

    return discounted_price