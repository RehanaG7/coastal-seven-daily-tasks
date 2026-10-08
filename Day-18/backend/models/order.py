from datetime import datetime, timezone
from typing import Any
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from core.database import Base
from models.product import Product


class Order(Base):
    __tablename__ = "orders"

    id: Any = Column(Integer, primary_key=True, index=True)
    user_id: Any = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount: Any = Column(Float, nullable=False)
    status: Any = Column(String, default="PENDING")
    created_at: Any = Column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Any = Column(Integer, primary_key=True, index=True)
    order_id: Any = Column(
        Integer, ForeignKey("orders.id"), nullable=False
    )
    product_id: Any = Column(
        Integer, ForeignKey("products.id"), nullable=False
    )
    quantity: Any = Column(Integer, nullable=False)
    price_at_purchase: Any = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

