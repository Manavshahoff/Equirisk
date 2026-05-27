from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class RiskRun(Base):
    __tablename__ = "risk_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, unique=True, index=True, nullable=False)
    run_type = Column(String, nullable=False)
    status = Column(String, nullable=False)

    total_trades = Column(Integer, nullable=False)
    priced_trades = Column(Integer, nullable=False)
    failed_trades = Column(Integer, nullable=False)

    total_market_value = Column(Float, nullable=False)
    total_delta = Column(Float, nullable=False)
    total_gamma = Column(Float, nullable=False)
    total_vega = Column(Float, nullable=False)
    total_theta = Column(Float, nullable=False)
    total_rho = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)


class TradeValuation(Base):
    __tablename__ = "trade_valuations"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, index=True, nullable=False)

    trade_id = Column(String, index=True, nullable=False)
    book = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    product_type = Column(String, nullable=False)
    option_type = Column(String, nullable=False)
    pricing_model = Column(String, nullable=False)

    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    market_value = Column(Float, nullable=False)

    delta = Column(Float, nullable=False)
    gamma = Column(Float, nullable=False)
    vega = Column(Float, nullable=False)
    theta = Column(Float, nullable=False)
    rho = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    saved_trades = relationship("SavedTrade", back_populates="owner")


class SavedTrade(Base):
    __tablename__ = "saved_trades"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    trade_id = Column(String, nullable=False)
    book = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    product_type = Column(String, nullable=False)
    option_type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    strike = Column(Float, nullable=False)
    expiry = Column(String, nullable=False)
    pricing_model = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="saved_trades")