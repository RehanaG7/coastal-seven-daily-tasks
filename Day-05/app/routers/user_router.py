from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.crud import crud_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    return await crud_user.create_user(db, user_in)

@router.get("/", response_model=list[UserRead])
async def list_users_endpoint(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    return await crud_user.get_users(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserRead)
async def get_user_endpoint(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserRead)
async def update_user_endpoint(user_id: int, user_in: UserUpdate, db: AsyncSession = Depends(get_db)):
    db_user = await crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return await crud_user.update_user(db, db_user, user_in)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_endpoint(user_id: int, db: AsyncSession = Depends(get_db)):
    db_user = await crud_user.get_user_by_id(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    await crud_user.delete_user(db, db_user)