from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import RiskRun, TradeValuation


def generate_run_id() -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    unique_part = str(uuid4())[:8].upper()

    return f"RISK-{today}-{unique_part}"


def save_risk_run(
    db: Session,
    risk_result: dict,
    run_type: str = "PORTFOLIO_RISK",
) -> str:
    run_id = generate_run_id()

    risk_run = RiskRun(
        run_id=run_id,
        run_type=run_type,
        status="completed",
        total_trades=risk_result["total_trades"],
        priced_trades=risk_result["priced_trades"],
        failed_trades=risk_result["failed_trades"],
        total_market_value=risk_result["total_market_value"],
        total_delta=risk_result["total_delta"],
        total_gamma=risk_result["total_gamma"],
        total_vega=risk_result["total_vega"],
        total_theta=risk_result["total_theta"],
        total_rho=risk_result["total_rho"],
    )

    db.add(risk_run)

    for trade_result in risk_result["trade_results"]:
        valuation = TradeValuation(
            run_id=run_id,
            trade_id=trade_result["trade_id"],
            book=trade_result["book"],
            symbol=trade_result["symbol"],
            product_type=trade_result["product_type"],
            option_type=trade_result["option_type"],
            pricing_model=trade_result["pricing_model"],
            quantity=trade_result["quantity"],
            unit_price=trade_result["unit_price"],
            market_value=trade_result["market_value"],
            delta=trade_result["delta"],
            gamma=trade_result["gamma"],
            vega=trade_result["vega"],
            theta=trade_result["theta"],
            rho=trade_result["rho"],
        )

        db.add(valuation)

    db.commit()

    return run_id