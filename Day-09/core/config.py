from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = (
        "sqlite:///./day09.db"  # Fallback for local testing, overridden by .env
    )
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png", ".webp"]
    ALLOWED_MIME_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    THUMBNAIL_WIDTH: int = 300
    THUMBNAIL_HEIGHT: int = 300

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        extra="ignore",
    )


settings = Settings()

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024
THUMBNAIL_SIZE = (settings.THUMBNAIL_WIDTH, settings.THUMBNAIL_HEIGHT)
