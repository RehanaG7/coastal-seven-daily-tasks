from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from core.config import settings

# Automatically handles SQLite vs PostgreSQL
if "sqlite" in settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL configuration with connection pooling
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_active_session() -> Session:
    """Returns active session from TestingSessionLocal during pytest, or SessionLocal in runtime."""
    import os
    if os.getenv("TESTING") == "1":
        try:
            from tests.conftest import TestingSessionLocal
            return TestingSessionLocal()
        except Exception:
            pass
    return SessionLocal()


def get_db() -> Generator[Session, None, None]:
    db = get_active_session()
    try:
        yield db
    finally:
        db.close()