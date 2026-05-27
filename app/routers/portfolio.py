from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.auth import get_current_user
from app.database import get_db
from app.schemas import SavedTradeCreate, SavedTradeResponse


router = APIRouter(
    prefix="/portfolio",
    tags=["Portfolio"],
)


@router.get("/my-trades", response_model=list[SavedTradeResponse])
def get_my_trades(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.SavedTrade)
        .filter(models.SavedTrade.user_id == current_user.id)
        .all()
    )


@router.post("/my-trades", response_model=SavedTradeResponse)
def save_trade(
    trade_data: SavedTradeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing_trade = (
        db.query(models.SavedTrade)
        .filter(
            models.SavedTrade.user_id == current_user.id,
            models.SavedTrade.trade_id == trade_data.trade_id,
        )
        .first()
    )

    if existing_trade:
        existing_trade.book = trade_data.book
        existing_trade.symbol = trade_data.symbol
        existing_trade.product_type = trade_data.product_type
        existing_trade.option_type = trade_data.option_type
        existing_trade.quantity = trade_data.quantity
        existing_trade.strike = trade_data.strike
        existing_trade.expiry = trade_data.expiry
        existing_trade.pricing_model = trade_data.pricing_model

        db.commit()
        db.refresh(existing_trade)

        return existing_trade

    saved_trade = models.SavedTrade(
        user_id=current_user.id,
        trade_id=trade_data.trade_id,
        book=trade_data.book,
        symbol=trade_data.symbol,
        product_type=trade_data.product_type,
        option_type=trade_data.option_type,
        quantity=trade_data.quantity,
        strike=trade_data.strike,
        expiry=trade_data.expiry,
        pricing_model=trade_data.pricing_model,
    )

    db.add(saved_trade)
    db.commit()
    db.refresh(saved_trade)

    return saved_trade

@router.delete("/my-trades/by-trade-id/{trade_id}")
def delete_saved_trade_by_trade_id(
    trade_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    trades = (
        db.query(models.SavedTrade)
        .filter(
            models.SavedTrade.user_id == current_user.id,
            models.SavedTrade.trade_id == trade_id,
        )
        .all()
    )

    for trade in trades:
        db.delete(trade)

    db.commit()

    return {
        "message": f"Deleted saved trade {trade_id}",
        "deleted_count": len(trades),
    }
