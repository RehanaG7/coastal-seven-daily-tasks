from pydantic import BaseModel, EmailStr

# Schema for incoming registration request
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "user"  # Defaults to "user", can pass "admin"

# Schema for returning user profile (Notice: NO password here!)
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True

# Schema for the JWT Token response returned after login
class Token(BaseModel):
    access_token: str
    token_type: str

# Schema for reading data extracted inside the token
class TokenData(BaseModel):
    username: str | None = None