from typing import Any
from sqlalchemy import Column, Float, Integer, String, Text
from core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Any = Column(Integer, primary_key=True, index=True)
    name: Any = Column(String, index=True, nullable=False)
    description: Any = Column(Text, nullable=True)
    price: Any = Column(Float, nullable=False)
    stock: Any = Column(Integer, nullable=False, default=0)
    image_url: Any = Column(String, nullable=True)
