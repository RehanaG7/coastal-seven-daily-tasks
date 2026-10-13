from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from tasks.task_manager import get_task, _tasks_store, _tasks_lock

router = APIRouter()


class TaskStatusResponse(BaseModel):
    task_id: str
    task_type: Optional[str] = "generic"
    status: str
    progress: int
    message: Optional[str] = ""
    metadata: Optional[Dict[str, Any]] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.get("/{task_id}", response_model=TaskStatusResponse)
def get_task_status(task_id: str):
    """
    Day 18 Celery Task Lifecycle Polling Endpoint:
    Returns real-time background job execution status, percentage progress (0-100),
    live step messages, and completed results or errors.
    """
    task = get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID '{task_id}' was not found in task registry.",
        )
    return task


@router.get("", response_model=Dict[str, Any])
def list_tasks():
    """List all registered background tasks in memory / Redis."""
    with _tasks_lock:
        return {
            "total_tasks": len(_tasks_store),
            "tasks": list(_tasks_store.values()),
        }


@router.post("/ai/reindex", summary="Asynchronously calculate and re-index vector catalog embeddings")
def trigger_ai_reindex_embeddings():
    """
    Day 22 Capstone Celery Task:
    Asynchronously chunks and computes vector embeddings for all products,
    populates ChromaDB, and invalidates Redis cache.
    """
    import uuid
    from tasks.ai_tasks import run_async_reindex_embeddings
    task_id = f"ai_reindex_{uuid.uuid4().hex[:8]}"
    run_async_reindex_embeddings(task_id)
    return {
        "task_id": task_id,
        "task_type": "ai_reindex_embeddings",
        "status": "PENDING",
        "message": "Asynchronous AI embedding re-index queued."
    }


@router.post("/ai/bulk-describe", summary="Asynchronously bulk generate AI product copy")
def trigger_ai_bulk_descriptions():
    """
    Day 22 Capstone Celery Task:
    Asynchronously generates SEO-optimized AI copy for catalog items.
    """
    import uuid
    from tasks.ai_tasks import run_async_bulk_ai_descriptions
    task_id = f"ai_bulk_desc_{uuid.uuid4().hex[:8]}"
    run_async_bulk_ai_descriptions(task_id)
    return {
        "task_id": task_id,
        "task_type": "ai_bulk_descriptions",
        "status": "PENDING",
        "message": "Asynchronous bulk AI description task queued."
    }
