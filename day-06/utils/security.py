from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from core.config import settings

# 1. Password Hashing Tool (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Takes a plain text password and scrambles it into a secure hash."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if a user's typed password matches the stored hash during login."""
    return pwd_context.verify(plain_password, hashed_password)

# 2. JWT Token Generator Tool
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Encodes user details into an encrypted JWT token with an expiration time."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)