from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class LoginSchema(BaseModel):
    email: str
    password: str

class RegisterSchema(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

def derive_clean_name(email: str, provided_name: Optional[str] = None) -> str:
    if provided_name and provided_name.strip():
        return provided_name.strip()
    
    local = email.split("@")[0].strip()
    domain = email.split("@")[1].split(".")[0].strip() if "@" in email and "." in email else ""
    
    # If email is admin@humza.com -> Name is Humza
    if local.lower() == "admin" and domain:
        return domain.capitalize()
    
    # If email contains rehana
    if "rehana" in local.lower() or "rehana" in domain.lower():
        return "Shaik Rehana"
        
    return local.capitalize()

@router.post("/login")
def login(payload: LoginSchema):
    email = payload.email.strip().lower()
    is_admin = ("admin" in email)
    name = derive_clean_name(email)

    return {
        "access_token": f"rmart-token-{email}",
        "token_type": "bearer",
        "user": {
            "email": email,
            "name": name,
            "is_admin": is_admin,
            "address": "Primary Store Location, AP",
            "phone": "+91 98765 43210",
        }
    }

@router.post("/register")
def register(payload: RegisterSchema):
    email = payload.email.strip().lower()
    name = derive_clean_name(email, payload.name)
    is_admin = ("admin" in email)

    return {
        "status": "success",
        "message": "User registered successfully",
        "user": {
            "email": email,
            "name": name,
            "is_admin": is_admin,
            "address": "Primary Store Location, AP",
            "phone": "+91 98765 43210",
        }
    }
