from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy import Column, DateTime, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from core.config import settings

db_url = settings.DATABASE_URL.strip()

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args: Dict[str, Any] = {}
engine_kwargs: Dict[str, Any] = {}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(db_url, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class UploadedFileModel(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    thumbnail = Column(String(255), nullable=False)
    original_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    uploaded_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
