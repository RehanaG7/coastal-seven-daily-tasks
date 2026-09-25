import time
from fastapi import APIRouter, BackgroundTasks, status
from celery.result import AsyncResult
from core.celery_app import celery_app
from tasks.worker_tasks import generate_monthly_report

router = APIRouter(prefix="/jobs", tags=["Background Tasks"])

def send_quick_log(message: str):
    time.sleep(1)
    print(f"[FastAPI BackgroundTask Log]: {message}")

# 1. FastAPI BackgroundTask (In-process, lightweight)
@router.post("/fastapi-background-task")
def run_fastapi_background(background_tasks: BackgroundTasks):
    background_tasks.add_task(send_quick_log, "Quick in-process log written")
    return {"message": "Lightweight task dispatched inside web server process"}

# 2. Celery Worker (External process, resilient, retryable)
@router.post("/celery-report/{user_id}", status_code=status.HTTP_202_ACCEPTED)
def trigger_celery_report(user_id: int):
    task = generate_monthly_report.delay(user_id)
    return {"message": "Heavy report task queued to Celery", "task_id": task.id}

# 3. Celery Task Status Endpoint
@router.get("/celery-status/{task_id}")
def get_task_status(task_id: str):
    result = AsyncResult(task_id, app=celery_app)
    return {
        "task_id": task_id,
        "status": result.status,  # PENDING, STARTED, SUCCESS, FAILURE
        "result": result.result if result.ready() else None
    }