from fastapi import APIRouter, Depends

from app.core.instruments import OptionTrade
from app.core.market import MarketData
from app.schemas import PriceTradeRequest, PriceTradeResponse
from app.services.pricing_service import price_trade
from app.schemas import (
    PriceTradeRequest,
    PriceTradeResponse,
    RunRiskRequest,
    RunRiskResponse,
    ScenarioRiskRequest,
    ScenarioRiskResponse,
)
from app.services.risk_service import run_portfolio_risk
from app.services.scenario_service import run_scenario_risk
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.persistence_service import save_risk_run



router = APIRouter(
    prefix="/pricing",
    tags=["Pricing"],
)


@router.post("/price-trade", response_model=PriceTradeResponse)
def price_single_trade(request: PriceTradeRequest):
    trade = OptionTrade(
        trade_id=request.trade_id,
        book=request.book,
        symbol=request.symbol,
        product_type=request.product_type,
        option_type=request.option_type,
        quantity=request.quantity,
        strike=request.strike,
        expiry=request.expiry,
        pricing_model=request.pricing_model,
    )

    market_data = MarketData(
        symbol=request.symbol,
        spot=request.spot,
        rate=request.rate,
        volatility=request.volatility,
        as_of_date=request.as_of_date,
    )

    return price_trade(trade, market_data)

@router.post("/run-risk", response_model=RunRiskResponse)
def run_risk(request: RunRiskRequest, db: Session = Depends(get_db)):
    trades = [
        OptionTrade(
            trade_id=item.trade_id,
            book=item.book,
            symbol=item.symbol,
            product_type=item.product_type,
            option_type=item.option_type,
            quantity=item.quantity,
            strike=item.strike,
            expiry=item.expiry,
            pricing_model=item.pricing_model,
        )
        for item in request.trades
    ]

    market_data_by_symbol = {
        item.symbol: MarketData(
            symbol=item.symbol,
            spot=item.spot,
            rate=item.rate,
            volatility=item.volatility,
            as_of_date=item.as_of_date,
        )
        for item in request.market_data
    }

    risk_result = run_portfolio_risk(trades, market_data_by_symbol)

    run_id = save_risk_run(
        db=db,
        risk_result=risk_result,
        run_type="PORTFOLIO_RISK",
    )

    risk_result["run_id"] = run_id

    return risk_result

@router.post("/scenario-risk", response_model=ScenarioRiskResponse)
def scenario_risk(request: ScenarioRiskRequest):
    trades = [
        OptionTrade(
            trade_id=item.trade_id,
            book=item.book,
            symbol=item.symbol,
            product_type=item.product_type,
            option_type=item.option_type,
            quantity=item.quantity,
            strike=item.strike,
            expiry=item.expiry,
            pricing_model=item.pricing_model,
        )
        for item in request.trades
    ]

    market_data_by_symbol = {
        item.symbol: MarketData(
            symbol=item.symbol,
            spot=item.spot,
            rate=item.rate,
            volatility=item.volatility,
            as_of_date=item.as_of_date,
        )
        for item in request.market_data
    }

    return run_scenario_risk(
        trades=trades,
        market_data_by_symbol=market_data_by_symbol,
        scenario_name=request.scenario.name,
        spot_shock=request.scenario.spot_shock,
        volatility_shock=request.scenario.volatility_shock,
        rate_shock=request.scenario.rate_shock,
    )