import json
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# In-memory store for task states (thread-safe)
_tasks_lock = threading.Lock()
_tasks_store: Dict[str, Dict[str, Any]] = {}


def register_task(task_id: str, task_type: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Register a new background task in PENDING state."""
    with _tasks_lock:
        task_data = {
            "task_id": task_id,
            "task_type": task_type,
            "status": "PENDING",
            "progress": 0,
            "message": "Task queued and waiting for worker execution...",
            "metadata": metadata or {},
            "result": None,
            "error": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        _tasks_store[task_id] = task_data
        _sync_to_redis(task_id, task_data)
        return task_data


def update_task(
    task_id: str,
    status: str = "PROGRESS",
    progress: int = 0,
    message: str = "",
    result: Optional[Any] = None,
    error: Optional[str] = None,
) -> Dict[str, Any]:
    """Update progress and status of a running background task."""
    with _tasks_lock:
        if task_id not in _tasks_store:
            _tasks_store[task_id] = {
                "task_id": task_id,
                "task_type": "generic",
                "status": status,
                "progress": progress,
                "message": message,
                "metadata": {},
                "result": result,
                "error": error,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        else:
            _tasks_store[task_id]["status"] = status
            _tasks_store[task_id]["progress"] = max(0, min(100, progress))
            if message:
                _tasks_store[task_id]["message"] = message
            if result is not None:
                _tasks_store[task_id]["result"] = result
            if error is not None:
                _tasks_store[task_id]["error"] = error
            _tasks_store[task_id]["updated_at"] = datetime.now(timezone.utc).isoformat()

        task_data = dict(_tasks_store[task_id])
        _sync_to_redis(task_id, task_data)
        return task_data


def get_task(task_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve current task telemetry and progress."""
    with _tasks_lock:
        if task_id in _tasks_store:
            return dict(_tasks_store[task_id])

    # Fallback to Redis if not in local thread memory
    try:
        from core.redis import get_redis_client
        client = get_redis_client()
        raw = client.get(f"task:{task_id}")
        if raw:
            return json.loads(raw)
    except Exception:
        pass

    # Fallback to Celery AsyncResult if available
    try:
        from tasks.celery_app import celery_app
        async_res = celery_app.AsyncResult(task_id)
        if async_res and async_res.state != "PENDING":
            state = async_res.state
            meta = async_res.info if isinstance(async_res.info, dict) else {}
            return {
                "task_id": task_id,
                "status": "SUCCESS" if state == "SUCCESS" else ("PROGRESS" if state == "PROGRESS" else state),
                "progress": meta.get("progress", 100 if state == "SUCCESS" else 0),
                "message": meta.get("message", f"Task is {state}"),
                "result": async_res.result if state == "SUCCESS" else None,
                "error": str(async_res.result) if state == "FAILURE" else None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
    except Exception:
        pass

    return None


def _sync_to_redis(task_id: str, data: Dict[str, Any]):
    """Sync task status to Redis cache for distributed awareness."""
    try:
        from core.redis import get_redis_client
        client = get_redis_client()
        client.set(f"task:{task_id}", json.dumps(data), ex=3600)
    except Exception:
        pass
