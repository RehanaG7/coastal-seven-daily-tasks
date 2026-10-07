from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
from models.order import Order

class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="cart_items")
    product = relationship("Product")

class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    product = relationship("Product")

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String, default="open") # open, in_progress, resolved
    priority = Column(String, default="medium") # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    product = relationship("Product")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, index=True, default="general")
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sender_role = Column(String, default="customer") # "customer" | "admin" | "system"
    sender_name = Column(String, default="Customer")
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Integer, default=0)

    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # None = broadcast to all
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default="order") # "order" | "stock" | "promo" | "support"
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

