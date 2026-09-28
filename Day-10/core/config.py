from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="allow")

    PROJECT_NAME: str = "Day 10 - E-Commerce Mini Project"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-jwt-key-for-day10-evaluation-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    DATABASE_URL: str = "sqlite:///./ecommerce.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"


settings = Settings()
