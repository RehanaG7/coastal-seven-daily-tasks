from collections.abc import AsyncGenerator
import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings

# 1. Create the asynchronous database engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Logs every raw SQL query to the terminal when DEBUG=True
    future=True
)

# 2. Session factory to generate new AsyncSession objects
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevents attributes from expiring after commit
    autoflush=False
)

# 3. FastAPI Dependency to yield a clean session per request
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()