from celery import Celery
from core.config import settings

broker_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/1"
backend_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/2"

celery_app = Celery(
    "day8_worker",
    broker=broker_url,
    backend=backend_url,
    include=["tasks.worker_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    broker_transport_options={"health_check_interval": 0},
    beat_schedule={
        "periodic-system-health-cleanup": {
            "task": "tasks.worker_tasks.periodic_cleanup_task",
            "schedule": 60.0,
        },
    }
)