from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from models.user import UserDB
from schemas.auth import UserCreate, UserResponse, Token
from utils.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if username or email is already taken
    existing_user = db.query(UserDB).filter(
        (UserDB.username == user_in.username) | (UserDB.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    # 2. Hash the password before saving
    hashed = hash_password(user_in.password)

    # 3. Create and save the new user record
    new_user = UserDB(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Find the user by username
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )

    # 2. Check if the password matches the hash
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )

    # 3. Generate and return the JWT token
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}