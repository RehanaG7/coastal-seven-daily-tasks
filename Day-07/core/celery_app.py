import time
from celery import Celery
from core.config import settings

celery_app = Celery(
    "task_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def send_task_assignment_notification(self, task_id: int, assignee_email: str, task_title: str):
    """
    Simulates sending an external email notification without blocking the API request.
    Includes automated retries on failure.
    """
    try:
        # Simulate network latency of sending an email
        time.sleep(2)
        return {
            "status": "delivered",
            "task_id": task_id,
            "recipient": assignee_email,
            "title": task_title,
        }
    except Exception as exc:
        raise self.retry(exc=exc)