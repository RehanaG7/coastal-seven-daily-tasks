import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Look for .env in current directory, backend root, or workspace root
_curr = Path(__file__).resolve().parent
_candidates = [
    _curr.parent / ".env",
    Path.cwd() / ".env",
    Path.cwd() / "backend" / ".env",
    _curr.parent.parent / ".env",
    _curr.parent.parent / "Day-10" / ".env",
]
_env_file = next((str(p) for p in _candidates if p.exists()), ".env")

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./ecommerce.db"
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=_env_file, extra="ignore")

settings = Settings()