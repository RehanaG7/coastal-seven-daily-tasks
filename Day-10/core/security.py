from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from jose import jwt
from passlib.context import CryptContext
from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(
    subject: Any, role: str, expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    to_encode = {"exp": expire, "sub": str(subject), "role": role}
    return jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
