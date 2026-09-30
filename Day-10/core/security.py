from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

SECRET_KEY = "rmart-super-secret-jwt-key-for-auth"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Shows a single "Value" field in the Swagger Authorize button
security_scheme = HTTPBearer(auto_error=True)

class TokenData(BaseModel):
    email: Optional[str] = None
    is_admin: bool = False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """Takes only the raw token value from the Authorization header."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        is_admin: bool = payload.get("is_admin", False)
        name: str = payload.get("name", "Shopper")
        if email is None:
            raise credentials_exception
        return {"email": email, "name": name, "is_admin": is_admin}
    except JWTError:
        raise credentials_exception

def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Authorize ONLY administrators. Rejects standard shoppers with 403 Forbidden."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required.",
        )
    return current_user

# Alias for compatibility
get_current_admin_user = require_admin
