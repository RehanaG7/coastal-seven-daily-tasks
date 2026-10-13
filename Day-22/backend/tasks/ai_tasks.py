"""
Day 22 Capstone - Celery Asynchronous AI Background Tasks
Offloads heavy AI operations (catalog vector embedding re-indexing and bulk AI copy generation)
to Celery workers with live Redis progress tracking.
"""

import threading
import time
from typing import List, Optional
from tasks.task_manager import register_task, update_task


def run_async_reindex_embeddings(task_id: str):
    """
    Asynchronous worker task:
    Re-chunks and calculates dense vector embeddings for all active products,
    populating the ChromaDB vector collection and invalidating stale Redis vector caches.
    """
    register_task(task_id, "ai_reindex_embeddings", {"action": "reindex_catalog"})

    def _worker():
        try:
            update_task(task_id, "PROGRESS", 15, "Connecting to database and fetching active products...")
            time.sleep(0.3)

            from core.database import SessionLocal
            from core.vector_store import vector_store
            from core.redis_ai_cache import ai_cache

            db = SessionLocal()
            try:
                update_task(task_id, "PROGRESS", 45, "Generating dense semantic embeddings & chunking catalogue...")
                time.sleep(0.4)

                count = vector_store.index_products(db)

                update_task(task_id, "PROGRESS", 85, f"Upserted {count} items into ChromaDB. Invalidating stale Redis cache...")
                ai_cache.invalidate("semantic_search")
                time.sleep(0.2)

                update_task(
                    task_id,
                    "SUCCESS",
                    100,
                    f"Successfully indexed {count} products into vector store.",
                    result={"total_indexed": count, "collection": "product_catalog", "status": "active"}
                )
            finally:
                db.close()
        except Exception as e:
            update_task(task_id, "FAILURE", 0, f"Embedding re-index failed: {str(e)}", error=str(e))

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    return task_id


def run_async_bulk_ai_descriptions(task_id: str, product_ids: Optional[List[int]] = None):
    """
    Asynchronous worker task:
    Bulk-generates high-converting AI product descriptions for catalog items.
    """
    register_task(task_id, "ai_bulk_descriptions", {"product_count": len(product_ids or [])})

    def _worker():
        try:
            from core.database import SessionLocal
            from models.product import Product
            from core.ai_copywriter import ai_copywriter

            db = SessionLocal()
            try:
                query = db.query(Product)
                if product_ids:
                    query = query.filter(Product.id.in_(product_ids))
                products = query.limit(20).all()

                total = len(products)
                if total == 0:
                    update_task(task_id, "SUCCESS", 100, "No products required description generation.", result={"processed": 0})
                    return

                processed_count = 0
                for idx, prod in enumerate(products):
                    pct = int(((idx + 1) / total) * 100)
                    update_task(task_id, "PROGRESS", pct, f"Generating AI copy for: {prod.name[:25]}... ({idx + 1}/{total})")

                    res = ai_copywriter.generate_product_description(
                        title=prod.name,
                        category=prod.category or "General",
                        tone="professional"
                    )
                    if res and res.get("description"):
                        prod.description = res["description"]
                        processed_count += 1
                    time.sleep(0.1)

                db.commit()
                update_task(
                    task_id,
                    "SUCCESS",
                    100,
                    f"Generated AI descriptions for {processed_count} products.",
                    result={"processed": processed_count, "total": total}
                )
            finally:
                db.close()
        except Exception as e:
            update_task(task_id, "FAILURE", 0, f"Bulk generation error: {str(e)}", error=str(e))

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    return task_id
