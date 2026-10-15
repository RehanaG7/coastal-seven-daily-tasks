from typing import Any
from sqlalchemy import Column, Integer, String
from core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Any = Column(Integer, primary_key=True, index=True)
    email: Any = Column(String, unique=True, index=True, nullable=False)
    hashed_password: Any = Column(String, nullable=False)
    full_name: Any = Column(String, nullable=True)
    role: Any = Column(String, default="user", nullable=False)
