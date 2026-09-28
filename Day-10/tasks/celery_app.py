import os
from celery import Celery
from core.config import settings

celery_app = Celery(
    "ecommerce_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

if os.getenv("TESTING") == "1":
    celery_app.conf.update(task_always_eager=True)
else:
    celery_app.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
    )
