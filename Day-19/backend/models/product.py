from typing import Any
from sqlalchemy import Column, Float, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import TSVECTOR
from core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Any = Column(Integer, primary_key=True, index=True)
    name: Any = Column(String, index=True, nullable=False)
    description: Any = Column(Text, nullable=True)
    price: Any = Column(Float, nullable=False)
    stock: Any = Column(Integer, nullable=False, default=0)
    image_url: Any = Column(String, nullable=True)
    category: Any = Column(String, nullable=True, default="General")
    search_vector: Any = Column(TSVECTOR().with_variant(Text, "sqlite"), nullable=True)

    __table_args__ = (
        Index("idx_products_search_vector", "search_vector", postgresql_using="gin"),
        Index("idx_products_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
    )

