import os

class Settings:
    PROJECT_NAME: str = "Day 8 Enterprise Backend"
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_URL: str = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    
    # Cache & Rate Limiting Constants
    CACHE_DEFAULT_TTL: int = 120  # 2 minutes
    RATE_LIMIT_REQUESTS: int = 5   # Max 5 requests
    RATE_LIMIT_WINDOW: int = 60    # Rolling 60 seconds

settings = Settings()