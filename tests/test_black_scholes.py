import pytest

from app.pricing.black_scholes import (
    BlackScholesInput,
    price,
    delta,
    gamma,
    vega,
    theta,
    rho,
    calculate_all,
)


def test_black_scholes_call_price():
    option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="call",
    )

    result = price(option)

    assert result == pytest.approx(8.02135, rel=1e-4)


def test_black_scholes_put_price():
    option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="put",
    )

    result = price(option)

    assert result == pytest.approx(7.90044, rel=1e-4)


def test_call_delta():
    option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="call",
    )

    result = delta(option)

    assert result == pytest.approx(0.54223, rel=1e-4)


def test_put_delta():
    option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="put",
    )

    result = delta(option)

    assert result == pytest.approx(-0.45776, rel=1e-4)


def test_gamma():
    option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="call",
    )

    result = gamma(option)

    assert round(result, 4) == 0.0198

def test_vega():
    option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="call",
    )

    result = vega(option)

    assert round(result, 4) == 39.6705


def test_theta_call():
    option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="call",
    )

    result = theta(option)

    assert round(result, 4) == -6.2771


def test_rho_call():
    option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="call",
    )

    result = rho(option)

    assert round(result, 4) == 46.2015


def test_calculate_all_returns_all_values():
    option = BlackScholesInput(
        spot=100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="call",
    )

    result = calculate_all(option)

    assert "price" in result
    assert "delta" in result
    assert "gamma" in result
    assert "vega" in result
    assert "theta" in result
    assert "rho" in result


def test_invalid_spot_raises_error():
    option = BlackScholesInput(
        spot=-100,
        strike=105,
        rate=0.05,
        volatility=0.20,
        time_to_maturity=1.0,
        option_type="call",
    )

    with pytest.raises(ValueError):
        price(option)