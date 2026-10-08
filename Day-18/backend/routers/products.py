import json
from pathlib import Path
from typing import List, Optional
from PIL import Image

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response, Request

from sqlalchemy.orm import Session
from sqlalchemy import func, text
from pydantic import BaseModel
import redis.asyncio as aioredis

from core.database import get_db
from core.config import settings
from core.redis import get_async_redis
from core.security import require_admin
from models.user import User
from models.product import Product
from tasks.csv_tasks import dispatch_csv_import_task

router = APIRouter()


# Directory for processed 300x300 images
UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Helper: Notify Admin WebSocket about product modifications
async def notify_admin_ws(event_type: str, product_id: int, product_name: str):
    try:
        r = await get_async_redis()
        payload = json.dumps({
            "event": event_type,
            "product_id": product_id,
            "product_name": product_name
        })
        await r.publish("admin_product_updates", payload)
        await r.close()
    except Exception:
        pass


class ProductCreate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = "No description"
    price: float
    stock: int
    category: Optional[str] = "General"

    def get_name(self) -> str:
        return self.name or self.title or "Unnamed Product"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    description: Optional[str] = None
    price: float
    stock: int
    image_url: Optional[str] = None
    category: Optional[str] = "General"

    class Config:
        from_attributes = True


class StockUpdate(BaseModel):
    stock: int


@router.get("", response_model=List[ProductResponse])
@router.get("/", response_model=List[ProductResponse])
async def list_products(
    page: int = 0,
    limit: int = 100,
    skip: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    q: Optional[str] = None,
    search_mode: Optional[str] = "auto",
    db: Session = Depends(get_db),
):
    """
    Day 18 Advanced Search Engine:
    - PostgreSQL Full-Text Search (tsvector + GIN Index) for ranking and fast search.
    - PostgreSQL Fuzzy Search (pg_trgm) for typo-tolerance and substring word similarity.
    - Automatic fallback for SQLite tests and standard category browsing.
    - Cache-Aside Redis layer for default catalog browsing.
    """
    term = (q or search or "").strip()
    is_plain_list = page == 0 and limit >= 50 and skip is None and category is None and not term

    # 1. Cache-Aside Pattern for Default Catalog Browse
    if is_plain_list:
        r = await get_async_redis()
        cache_key = "products:catalog"
        cached = await r.get(cache_key)
        if cached:
            await r.close()
            return json.loads(cached)

    base_query = db.query(Product)
    if category and category.lower() != "all":
        base_query = base_query.filter(Product.category.ilike(f"%{category}%"))

    offset_val = skip if skip is not None else (page * limit if page > 0 else 0)
    products = []

    is_postgres = False
    try:
        bind = db.get_bind()
        is_postgres = bind.dialect.name == "postgresql"
    except Exception:
        pass

    if term and is_postgres:
        mode = (search_mode or "auto").lower()

        # -------------------------------------------------------------
        # Mode 1: Pure Full-Text Search (PostgreSQL tsvector + GIN)
        # -------------------------------------------------------------
        if mode == "fts":
            try:
                products = (
                    base_query.filter(
                        text("search_vector @@ plainto_tsquery('english', :term)")
                    )
                    .params(term=term)
                    .order_by(
                        text("ts_rank(search_vector, plainto_tsquery('english', :term)) DESC")
                    )
                    .offset(offset_val)
                    .limit(limit)
                    .all()
                )
            except Exception:
                products = []

        # -------------------------------------------------------------
        # Mode 2: Pure Fuzzy / Typo-Tolerant Search (pg_trgm)
        # -------------------------------------------------------------
        elif mode == "fuzzy":
            try:
                products = (
                    base_query.filter(
                        text("GREATEST(similarity(name, :term), word_similarity(:term, name)) >= 0.2")
                    )
                    .params(term=term)
                    .order_by(
                        text("GREATEST(similarity(name, :term), word_similarity(:term, name)) DESC")
                    )
                    .offset(offset_val)
                    .limit(limit)
                    .all()
                )
            except Exception:
                products = []

        # -------------------------------------------------------------
        # Mode 3: Smart Auto (FTS -> pg_trgm Fuzzy Fallback -> ILIKE)
        # -------------------------------------------------------------
        else:
            # 1. Try Full-Text Search first
            try:
                products = (
                    base_query.filter(
                        text("search_vector @@ plainto_tsquery('english', :term)")
                    )
                    .params(term=term)
                    .order_by(
                        text("ts_rank(search_vector, plainto_tsquery('english', :term)) DESC")
                    )
                    .offset(offset_val)
                    .limit(limit)
                    .all()
                )
            except Exception:
                products = []

            # 2. If 0 FTS matches (e.g. typo "iphne", "headphons"), run pg_trgm fuzzy match
            if not products:
                try:
                    products = (
                        base_query.filter(
                            text("GREATEST(similarity(name, :term), word_similarity(:term, name)) >= 0.25")
                        )
                        .params(term=term)
                        .order_by(
                            text("GREATEST(similarity(name, :term), word_similarity(:term, name)) DESC")
                        )
                        .offset(offset_val)
                        .limit(limit)
                        .all()
                    )
                except Exception:
                    products = []

            # 3. Final safety fallback to ILIKE
            if not products:
                products = (
                    base_query.filter(
                        Product.name.ilike(f"%{term}%")
                        | Product.description.ilike(f"%{term}%")
                        | Product.category.ilike(f"%{term}%")
                    )
                    .offset(offset_val)
                    .limit(limit)
                    .all()
                )

    elif term:
        # Cross-database fallback (SQLite / unit tests) with multi-word & typo tolerance
        term_words = [w for w in term.split() if w]
        if term_words:
            from sqlalchemy import and_
            word_filters = []
            for w in term_words:
                word_filters.append(
                    Product.name.ilike(f"%{w}%")
                    | Product.description.ilike(f"%{w}%")
                    | Product.category.ilike(f"%{w}%")
                )
            products = (
                base_query.filter(and_(*word_filters))
                .offset(offset_val)
                .limit(limit)
                .all()
            )
        else:
            products = []

        # If 0 matches in SQLite (e.g. typos like 'iphne', 'lapotp'), apply difflib fuzzy matching
        if not products and len(term) >= 2:
            import difflib
            all_prods = base_query.all()
            scored = []
            term_lower = term.lower()
            for p in all_prods:
                p_text = f"{p.name} {p.description or ''} {p.category or ''}".lower()
                words = p_text.split()
                name_ratio = difflib.SequenceMatcher(None, term_lower, p.name.lower()).ratio()
                word_ratios = [difflib.SequenceMatcher(None, term_lower, w.strip(",.-()")) for w in words]
                best_word_ratio = max(word_ratios) if word_ratios else 0.0
                best_ratio = max(name_ratio, best_word_ratio)
                if best_ratio >= 0.6 or term_lower in p_text:
                    scored.append((best_ratio, p))
            scored.sort(key=lambda x: x[0], reverse=True)
            products = [item[1] for item in scored[offset_val : offset_val + limit]]
    else:
        # Regular category browse / paginated list
        products = base_query.offset(offset_val).limit(limit).all()

    serialized = [
        {
            "id": p.id,
            "name": p.name,
            "title": p.name,
            "description": p.description or "",
            "price": float(p.price),
            "stock": p.stock,
            "image_url": p.image_url,
            "category": getattr(p, "category", "General") or "General",
        }
        for p in products
    ]

    if is_plain_list:
        r = await get_async_redis()
        await r.setex("products:catalog", 60, json.dumps(serialized))
        await r.close()

    return serialized


@router.post("/bulk-import-csv")
async def bulk_import_csv(
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Day 18 Bulk CSV Import with Live Progress:
    Accepts CSV file upload (multipart/form-data) or raw JSON string,
    dispatches async background worker task, and returns task ID for real-time progress tracking in React UI.
    """
    content = ""
    filename = "products_import.csv"
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        form = await request.form()
        uploaded = form.get("file")
        if uploaded and hasattr(uploaded, "read"):
            raw_bytes = await uploaded.read()
            content = raw_bytes.decode("utf-8", errors="replace")
            filename = getattr(uploaded, "filename", filename) or filename
        elif form.get("csv_content"):
            content = str(form.get("csv_content"))
            filename = str(form.get("filename", filename))
    else:
        # JSON payload
        try:
            body = await request.json()
            content = body.get("csv_content", "")
            filename = body.get("filename", filename)
        except Exception:
            pass

    content = (content or "").lstrip("\ufeff\xef\xbb\xbf\u200b").strip()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No CSV file or csv_content provided in request."
        )

    task_id = dispatch_csv_import_task(content, filename)
    return {
        "task_id": task_id,
        "status": "PENDING",
        "message": f"Bulk CSV product import successfully queued for '{filename}'.",
        "poll_url": f"/api/v1/tasks/{task_id}",
    }



@router.get("/sample-csv-template")
def get_sample_csv_template():
    """
    Returns a downloadable sample CSV template for bulk product import.
    """
    sample = (
        "name,category,price,stock,description,image_url\n"
        "Bose QuietComfort 45,Deals and Savings,279.99,35,Noise cancelling smart wireless headphones,https://picsum.photos/seed/bose45/400/300\n"
        "Sony PlayStation DualSense Edge,Games and Live Shopping,199.99,20,Pro wireless controller with customizable sticks,https://picsum.photos/seed/edge/400/300\n"
        "Ergonomic Standing Desk Pro,Home and Furniture,399.00,15,Dual motor motorized adjustable height standing desk,https://picsum.photos/seed/desk/400/300\n"
        "Keychron K2 Wireless Mechanical Keyboard,Mobiles and Electronics,89.99,50,Compact 75 percent Bluetooth mechanical keyboard,https://picsum.photos/seed/keychron/400/300\n"
        "Hydro Flask 32oz Wide Mouth Water Bottle,Everyday Needs,44.95,60,Vacuum insulated stainless steel water bottle,https://picsum.photos/seed/hydro/400/300\n"
    )
    return Response(
        content=sample,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products_template.csv"}
    )



@router.patch("/{product_id}/stock", response_model=ProductResponse)
async def patch_product_stock(
    product_id: int,
    payload: StockUpdate,
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.stock = payload.stock
    db.commit()
    db.refresh(product)
    
    try:
        r = await get_async_redis()
        await r.delete("products:catalog")
        await r.close()
    except Exception:
        pass
    return product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    prod_name = payload.get_name()
    product = Product(
        name=prod_name,
        description=payload.description,
        price=payload.price,
        stock=payload.stock,
        category=payload.category or "General",
        image_url=None,
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Invalidate Cache
    r = await get_async_redis()
    await r.delete("products:catalog")
    await r.close()

    # Broadcast to Admin WebSocket
    await notify_admin_ws("PRODUCT_CREATED", product.id, product.name)
    return product


@router.post("/{product_id}/upload-image", response_model=ProductResponse)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Pillow Validation & Resize: Converts any image into a standardized 300x300 PNG.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    filename = f"product_{product_id}.png"
    target_path = UPLOAD_DIR / filename

    try:
        # Validate integrity
        image = Image.open(file.file)
        image.verify()
        
        # Reload and resize to exactly 300x300
        file.file.seek(0)
        image = Image.open(file.file)
        image = image.convert("RGB")
        resized_img = image.resize((300, 300), Image.Resampling.LANCZOS)
        resized_img.save(target_path, format="PNG", quality=90)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image validation/processing failed: {str(e)}")

    # Update database record
    product.image_url = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(product)

    # Invalidate Cache
    r = await get_async_redis()
    await r.delete("products:catalog")
    await r.close()

    # Broadcast to Admin WebSocket
    await notify_admin_ws("PRODUCT_IMAGE_UPDATED", product.id, product.name)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    
    # Invalidate Cache
    r = await get_async_redis()
    await r.delete("products:catalog")
    await r.close()

    # Broadcast to Admin WebSocket
    await notify_admin_ws("PRODUCT_DETAILS_MODIFIED", product.id, product.name)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    
    p_id = product.id
    p_name = product.name
    
    try:
        from models.order import OrderItem
        db.query(OrderItem).filter(OrderItem.product_id == p_id).delete(synchronize_session=False)
        db.delete(product)
        db.commit()
    except Exception:
        db.rollback()
        try:
            from models.order import OrderItem
            db.query(OrderItem).filter(OrderItem.product_id == p_id).delete(synchronize_session=False)
            db.delete(product)
            db.commit()
        except Exception:
            pass

    # Invalidate Redis Cache
    try:
        r = await get_async_redis()
        await r.delete("products:catalog")
        await r.close()
    except Exception:
        pass

    # Broadcast to Admin WebSocket
    try:
        await notify_admin_ws("PRODUCT_DELETED", p_id, p_name)
    except Exception:
        pass

    return Response(status_code=status.HTTP_204_NO_CONTENT)