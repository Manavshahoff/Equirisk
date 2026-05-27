from fastapi import APIRouter, HTTPException

from app.schemas import MarketQuoteResponse
from app.services.market_data_service import fetch_latest_quote


router = APIRouter(
    prefix="/market",
    tags=["Market Data"],
)


@router.get("/quote/{symbol}", response_model=MarketQuoteResponse)
def get_latest_quote(symbol: str):
    try:
        return fetch_latest_quote(symbol)

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch market data: {error}",
        )