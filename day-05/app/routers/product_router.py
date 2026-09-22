from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.crud import crud_product, crud_user

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product_endpoint(product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    owner = await crud_user.get_user_by_id(db, product_in.owner_id)
    if not owner:
        raise HTTPException(status_code=400, detail="Owner user ID does not exist")
    return await crud_product.create_product(db, product_in)

@router.get("/", response_model=list[ProductRead])
async def list_products_endpoint(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    return await crud_product.get_products(db, skip=skip, limit=limit)

@router.get("/{product_id}", response_model=ProductRead)
async def get_product_endpoint(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await crud_product.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.patch("/{product_id}", response_model=ProductRead)
async def update_product_endpoint(product_id: int, product_in: ProductUpdate, db: AsyncSession = Depends(get_db)):
    db_product = await crud_product.get_product_by_id(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    return await crud_product.update_product(db, db_product, product_in)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_endpoint(product_id: int, db: AsyncSession = Depends(get_db)):
    db_product = await crud_product.get_product_by_id(db, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    await crud_product.delete_product(db, db_product)