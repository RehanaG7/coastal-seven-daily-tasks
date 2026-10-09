import csv
import io
import time
import uuid
import threading
from typing import Optional, List, Dict, Any

from core.database import get_active_session
from models.product import Product
from tasks.celery_app import celery_app
from tasks.task_manager import register_task, update_task


import re

def is_number(val: Any) -> bool:
    try:
        clean = re.sub(r"[^\d.]", "", str(val or "")).strip()
        float(clean)
        return bool(clean)
    except (ValueError, TypeError):
        return False


def clean_header_key(k: Any) -> str:
    if not k:
        return ""
    # Strip UTF-8 BOM, zero-width characters, quotes, and whitespace
    return str(k).lstrip("\ufeff\xef\xbb\xbf\u200b").strip().strip("\"'").lower()


def extract_field_by_aliases(row_dict: Dict[str, Any], aliases: List[str]) -> Optional[str]:
    for alias in aliases:
        if alias in row_dict and str(row_dict[alias]).strip():
            return str(row_dict[alias]).strip()
    return None


def process_bulk_csv_import(csv_content: str, filename: str, task_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Parses CSV and imports products into PostgreSQL with step-by-step progress tracking.
    Handles UTF-8 BOM, custom delimiters (comma, semicolon, tab, pipe), header aliases,
    and headerless CSV files automatically.
    """
    if task_id:
        update_task(task_id, status="PROGRESS", progress=5, message="Validating CSV structure and headers...")

    db = get_active_session()
    imported_products = []
    errors = []

    try:
        # 1. Clean BOM & normalize content
        content = (csv_content or "").lstrip("\ufeff\xef\xbb\xbf\u200b").strip()
        lines = [line for line in content.splitlines() if line.strip()]
        if not lines:
            if task_id:
                update_task(task_id, status="FAILURE", progress=0, error="CSV file is empty or missing headers.")
            return {"status": "FAILED", "total_rows": 0, "imported_count": 0, "errors": ["CSV file contains no data rows."]}

        # 2. Auto-detect delimiter
        first_line = lines[0]
        delimiters = [",", ";", "\t", "|"]
        counts = {d: first_line.count(d) for d in delimiters}
        delim = max(counts, key=counts.get) if any(counts.values()) and max(counts.values()) > 0 else ","

        # 3. Read raw CSV rows
        raw_rows = list(csv.reader(io.StringIO(content), delimiter=delim))
        # Filter out empty rows
        raw_rows = [r for r in raw_rows if any(cell.strip() for cell in r)]
        if not raw_rows:
            if task_id:
                update_task(task_id, status="FAILURE", progress=0, error="CSV file contains no data rows.")
            return {"status": "FAILED", "total_rows": 0, "imported_count": 0, "errors": ["CSV file contains no data rows."]}

        # 4. Determine if the first row is a header row
        first_row_cleaned = [clean_header_key(c) for c in raw_rows[0]]
        known_header_keywords = {
            "name", "product", "product_name", "product name", "title", "item", "item_name",
            "price", "cost", "unit_price", "rate", "amount", "mrp",
            "stock", "qty", "quantity", "inventory", "count",
            "category", "cat", "department", "type",
            "description", "desc", "details", "summary",
            "image", "image_url", "image url", "img"
        }
        
        has_known_header = any(
            cell in known_header_keywords or any(k in cell for k in ["name", "title", "price", "stock", "category", "desc"])
            for cell in first_row_cleaned
        )
        has_numeric_in_first_row = any(
            is_number(c) and len(c.strip()) > 0 for c in raw_rows[0][1:4]
        ) if len(raw_rows[0]) > 1 else False

        has_header = has_known_header and not has_numeric_in_first_row

        # Aliases mapping
        name_aliases = [
            "name", "product_name", "product name", "title", "product title", "product_title",
            "product", "item", "item_name", "item name", "productname", "itemname", "label"
        ]
        price_aliases = ["price", "cost", "unit_price", "unit price", "rate", "amount", "mrp", "selling_price", "selling price"]
        stock_aliases = ["stock", "quantity", "qty", "inventory", "count", "units", "available"]
        category_aliases = ["category", "cat", "department", "type", "genre", "group"]
        desc_aliases = ["description", "desc", "details", "summary", "about", "features", "info"]
        image_aliases = ["image_url", "image", "img", "photo", "picture", "thumbnail", "url", "image url", "image_link"]

        items_to_process = []
        if has_header:
            header_keys = first_row_cleaned
            data_rows = raw_rows[1:]
            for row in data_rows:
                row_dict = {}
                for col_idx, col_name in enumerate(header_keys):
                    if col_idx < len(row):
                        row_dict[col_name] = row[col_idx].strip()
                items_to_process.append((row_dict, row))
        else:
            # Entire file consists of product data (headerless)
            for row in raw_rows:
                items_to_process.append(({}, row))

        total_rows = len(items_to_process)
        if total_rows == 0:
            if task_id:
                update_task(task_id, status="FAILURE", progress=0, error="CSV file contains headers but no product rows.")
            return {"status": "FAILED", "total_rows": 0, "imported_count": 0, "errors": ["CSV file contains headers but no product rows."]}

        if task_id:
            update_task(task_id, status="PROGRESS", progress=10, message=f"CSV validated. Found {total_rows} products to process.")

        for idx, (row_dict, raw_row) in enumerate(items_to_process, 1):
            try:
                # 1. Product Name extraction
                name = extract_field_by_aliases(row_dict, name_aliases)
                if not name and raw_row:
                    # Positional fallback: find first non-numeric cell
                    for cell in raw_row:
                        c_str = cell.strip()
                        if c_str and not is_number(c_str):
                            name = c_str
                            break

                if not name or not name.strip():
                    errors.append(f"Row {idx}: Missing product name. Skipping.")
                    continue

                name = name.strip()

                # 2. Price extraction
                price_val = extract_field_by_aliases(row_dict, price_aliases)
                if not price_val and len(raw_row) >= 3 and is_number(raw_row[2]):
                    price_val = raw_row[2]
                elif not price_val and len(raw_row) >= 2 and is_number(raw_row[1]):
                    price_val = raw_row[1]

                try:
                    clean_price = re.sub(r"[^\d.]", "", str(price_val or "0.0"))
                    price = float(clean_price) if clean_price else 0.0
                except Exception:
                    price = 0.0

                # 3. Stock extraction
                stock_val = extract_field_by_aliases(row_dict, stock_aliases)
                if not stock_val and len(raw_row) >= 4 and is_number(raw_row[3]):
                    stock_val = raw_row[3]
                elif not stock_val and len(raw_row) >= 3 and is_number(raw_row[2]):
                    stock_val = raw_row[2]

                try:
                    clean_stock = re.sub(r"[^\d]", "", str(stock_val or "10"))
                    stock = int(clean_stock) if clean_stock else 10
                except Exception:
                    stock = 10

                # 4. Category extraction
                category = extract_field_by_aliases(row_dict, category_aliases)
                if not category and len(raw_row) >= 2 and not is_number(raw_row[1]):
                    category = raw_row[1].strip()
                if not category:
                    category = "General"

                # 5. Description extraction
                description = extract_field_by_aliases(row_dict, desc_aliases)
                if not description and len(raw_row) >= 5 and raw_row[4].strip():
                    description = raw_row[4].strip()
                if not description:
                    description = f"High quality {name} in {category}"

                # 6. Image URL extraction
                image_url = extract_field_by_aliases(row_dict, image_aliases)
                if not image_url and len(raw_row) >= 6 and raw_row[5].strip():
                    image_url = raw_row[5].strip()
                if not image_url or not str(image_url).startswith("http"):
                    image_url = f"https://picsum.photos/seed/{abs(hash(name)) % 1000}/400/300"

                # Check if product already exists
                existing = db.query(Product).filter(Product.name == name).first()
                if existing:
                    existing.price = price
                    existing.stock = stock
                    existing.category = category
                    existing.description = description
                    existing.image_url = image_url
                    prod_id = existing.id
                else:
                    new_prod = Product(
                        name=name,
                        price=price,
                        stock=stock,
                        category=category,
                        description=description,
                        image_url=image_url
                    )
                    db.add(new_prod)
                    db.flush()
                    prod_id = new_prod.id

                imported_products.append({
                    "id": prod_id,
                    "name": name,
                    "category": category,
                    "price": price,
                    "stock": stock,
                })

                # Calculate progress
                pct = int(10 + (idx / total_rows) * 85)
                if task_id:
                    # Pacing for realistic UI progress observation
                    time.sleep(0.08)
                    update_task(
                        task_id,
                        status="PROGRESS",
                        progress=pct,
                        message=f"Importing item {idx} of {total_rows}: '{name[:32]}'...",
                        result={"imported_so_far": idx, "total_rows": total_rows}
                    )

            except Exception as row_err:
                errors.append(f"Row {idx} ({row_dict.get('name') or 'Item'}): {str(row_err)}")

        # Update search_vector for newly inserted products if postgresql
        try:
            from sqlalchemy import text
            db.execute(text("UPDATE products SET search_vector = to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')) WHERE search_vector IS NULL"))
        except Exception:
            pass

        # Commit all imported/updated products
        db.commit()

        # Invalidate Redis catalog cache so UI reflects imported products
        try:
            from core.redis import get_redis_client
            r = get_redis_client()
            r.delete("products:catalog")
        except Exception:
            pass

        result = {
            "status": "COMPLETED",
            "filename": filename,
            "total_rows": total_rows,
            "imported_count": len(imported_products),
            "errors": errors,
            "items": imported_products[:10],  # sample items preview
        }

        if task_id:
            update_task(
                task_id,
                status="SUCCESS",
                progress=100,
                message=f"Successfully imported {len(imported_products)} of {total_rows} products!",
                result=result,
            )

        return result

    except Exception as e:
        db.rollback()
        if task_id:
            update_task(task_id, status="FAILURE", progress=0, error=str(e))
        raise
    finally:
        db.close()


@celery_app.task(name="bulk_import_products_task", bind=True)
def celery_bulk_import_products(self, csv_content: str, filename: str):
    """Celery background task for async bulk product import."""
    task_id = self.request.id or str(uuid.uuid4())
    register_task(task_id, "bulk_csv_import", {"filename": filename})
    return process_bulk_csv_import(csv_content, filename, task_id)


def dispatch_csv_import_task(csv_content: str, filename: str) -> str:
    """
    Dispatches bulk CSV import task.
    Executes in background daemon thread and submits to Celery.
    """
    task_id = f"task-csv-{uuid.uuid4().hex[:8]}"
    register_task(task_id, "bulk_csv_import", {"filename": filename})

    thread = threading.Thread(
        target=process_bulk_csv_import,
        args=(csv_content, filename, task_id),
        daemon=True,
    )
    thread.start()

    try:
        celery_bulk_import_products.apply_async(args=[csv_content, filename], task_id=task_id)
    except Exception:
        pass

    return task_id
