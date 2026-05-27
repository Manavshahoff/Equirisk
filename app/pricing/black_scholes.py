import math
from dataclasses import dataclass
from typing import Literal


OptionType = Literal["call", "put"]


@dataclass(frozen=True)
class BlackScholesInput:
    spot: float
    strike: float
    rate: float
    volatility: float
    time_to_maturity: float
    option_type: OptionType


def normal_cdf(x: float) -> float:
    """
    Standard normal cumulative distribution function.
    This gives N(x) in the Black-Scholes formula.
    """
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def normal_pdf(x: float) -> float:
    """
    Standard normal probability density function.
    This is used for Gamma and Vega.
    """
    return (1.0 / math.sqrt(2.0 * math.pi)) * math.exp(-0.5 * x * x)


def validate_inputs(inputs: BlackScholesInput) -> None:
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


def calculate_d1(inputs: BlackScholesInput) -> float:
    """
    d1 measures how far the option is from the strike,
    adjusted for interest rate, volatility, and time.
    """
    validate_inputs(inputs)

    if inputs.volatility == 0 or inputs.time_to_maturity == 0:
        raise ValueError("d1 is undefined when volatility or time to maturity is zero.")

    numerator = math.log(inputs.spot / inputs.strike) + (
        inputs.rate + 0.5 * inputs.volatility**2
    ) * inputs.time_to_maturity

    denominator = inputs.volatility * math.sqrt(inputs.time_to_maturity)

    return numerator / denominator


def calculate_d2(inputs: BlackScholesInput) -> float:
    """
    d2 is d1 adjusted downward by volatility over time.
    """
    d1 = calculate_d1(inputs)
    return d1 - inputs.volatility * math.sqrt(inputs.time_to_maturity)


def intrinsic_value(inputs: BlackScholesInput) -> float:
    """
    Value of the option at expiry or when time/volatility edge case happens.
    """
    if inputs.option_type == "call":
        return max(inputs.spot - inputs.strike, 0.0)

    return max(inputs.strike - inputs.spot, 0.0)


def price(inputs: BlackScholesInput) -> float:
    """
    Calculates Black-Scholes price for a European call or put option.
    """
    validate_inputs(inputs)

    if inputs.time_to_maturity == 0:
        return intrinsic_value(inputs)

    if inputs.volatility == 0:
        discounted_strike = inputs.strike * math.exp(-inputs.rate * inputs.time_to_maturity)

        if inputs.option_type == "call":
            return max(inputs.spot - discounted_strike, 0.0)

        return max(discounted_strike - inputs.spot, 0.0)

    d1 = calculate_d1(inputs)
    d2 = calculate_d2(inputs)

    discounted_strike = inputs.strike * math.exp(-inputs.rate * inputs.time_to_maturity)

    if inputs.option_type == "call":
        return inputs.spot * normal_cdf(d1) - discounted_strike * normal_cdf(d2)

    return discounted_strike * normal_cdf(-d2) - inputs.spot * normal_cdf(-d1)

# Delta tells you how much the option price changes when the stock price changes by $1.
def delta(inputs: BlackScholesInput) -> float:
    """
    Delta measures option price sensitivity to spot price.
    """
    validate_inputs(inputs)

    if inputs.time_to_maturity == 0 or inputs.volatility == 0:
        if inputs.option_type == "call":
            return 1.0 if inputs.spot > inputs.strike else 0.0
        return -1.0 if inputs.spot < inputs.strike else 0.0

    d1 = calculate_d1(inputs)

    if inputs.option_type == "call":
        return normal_cdf(d1)

    return normal_cdf(d1) - 1.0

# Gamma tells you how fast Delta changes when the stock price changes. 
def gamma(inputs: BlackScholesInput) -> float:
    """
    Gamma measures how fast Delta changes when spot price changes.
    """
    validate_inputs(inputs)

    if inputs.time_to_maturity == 0 or inputs.volatility == 0:
        return 0.0

    d1 = calculate_d1(inputs)

    return normal_pdf(d1) / (
        inputs.spot * inputs.volatility * math.sqrt(inputs.time_to_maturity)
    )

# Vega tells you how much the option price changes when volatility changes.
def vega(inputs: BlackScholesInput) -> float:
    """
    Vega measures sensitivity to volatility.

    This returns Vega per 1.00 change in volatility.
    To get Vega per 1% volatility change, divide by 100.
    """
    validate_inputs(inputs)

    if inputs.time_to_maturity == 0 or inputs.volatility == 0:
        return 0.0

    d1 = calculate_d1(inputs)

    return inputs.spot * normal_pdf(d1) * math.sqrt(inputs.time_to_maturity)

# Theta tells you how much the option price changes as time passes.
def theta(inputs: BlackScholesInput) -> float:
    """
    Theta measures sensitivity to time passing.

    This returns annual theta.
    To get daily theta, divide by 365.
    """
    validate_inputs(inputs)

    if inputs.time_to_maturity == 0 or inputs.volatility == 0:
        return 0.0

    d1 = calculate_d1(inputs)
    d2 = calculate_d2(inputs)

    first_term = -(
        inputs.spot
        * normal_pdf(d1)
        * inputs.volatility
        / (2.0 * math.sqrt(inputs.time_to_maturity))
    )

    discounted_strike = inputs.strike * math.exp(-inputs.rate * inputs.time_to_maturity)

    if inputs.option_type == "call":
        second_term = -inputs.rate * discounted_strike * normal_cdf(d2)
        return first_term + second_term

    second_term = inputs.rate * discounted_strike * normal_cdf(-d2)
    return first_term + second_term

# Rho tells you how much the option price changes when the interest rate changes.
def rho(inputs: BlackScholesInput) -> float:
    """
    Rho measures sensitivity to interest rate.

    This returns Rho per 1.00 change in rate.
    To get Rho per 1% rate change, divide by 100.
    """
    validate_inputs(inputs)

    if inputs.time_to_maturity == 0:
        return 0.0

    if inputs.volatility == 0:
        return 0.0

    d2 = calculate_d2(inputs)

    discounted_strike = inputs.strike * math.exp(-inputs.rate * inputs.time_to_maturity)

    if inputs.option_type == "call":
        return inputs.time_to_maturity * discounted_strike * normal_cdf(d2)

    return -inputs.time_to_maturity * discounted_strike * normal_cdf(-d2)


def calculate_all(inputs: BlackScholesInput) -> dict:
    """
    Returns price and all major Greeks in one dictionary.
    """
    return {
        "price": price(inputs),
        "delta": delta(inputs),
        "gamma": gamma(inputs),
        "vega": vega(inputs),
        "theta": theta(inputs),
        "rho": rho(inputs),
    }


if __name__ == "__main__":
    sample_option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="call",
    )

    result = calculate_all(sample_option)

    for key, value in result.items():
        print(f"{key}: {value:.6f}")