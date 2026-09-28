from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from core.config import settings

is_sqlite = "sqlite" in settings.DATABASE_URL
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
