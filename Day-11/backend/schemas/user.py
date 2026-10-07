from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.USER


class UserResponse(UserBase):
    id: int
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
