import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Dynamically locate the .env file in the Day-07 root
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Task Management API"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = str(ENV_PATH)
        extra = "ignore"


settings = Settings()