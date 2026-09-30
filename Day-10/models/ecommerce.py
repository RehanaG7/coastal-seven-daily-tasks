from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text

try:
    from core.database import Base
except ImportError:
    from database import Base

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    product_name = Column(String, nullable=True)
    price = Column(Float, default=0.0)
    quantity = Column(Integer, default=1)
    status = Column(String, default="Order Placed")  # Order Placed, Shipped, Out for Delivery, Delivered
    created_at = Column(DateTime, default=datetime.utcnow)

class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    product_id = Column(Integer)
    product_name = Column(String)
    price = Column(Float)
    quantity = Column(Integer, default=1)
    image_url = Column(String, nullable=True)

class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    product_id = Column(Integer)
    product_name = Column(String)
    price = Column(Float)
    image_url = Column(String, nullable=True)

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    order_id = Column(Integer, nullable=True)
    subject = Column(String)
    message = Column(Text)
    status = Column(String, default="Open")  # Open, In Review, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True)
    user_email = Column(String)
    rating = Column(Integer)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)