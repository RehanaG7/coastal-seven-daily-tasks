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
