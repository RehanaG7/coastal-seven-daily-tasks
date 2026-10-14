import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "ecommerce_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="process_image_upload")
def process_image_upload(file_path: str):
    print(f"[CELERY WORKER] Processing high-res product image: {file_path}")
    return {"status": "optimized", "file": file_path}

@celery_app.task(name="send_order_notification")
def send_order_notification(user_email: str, order_id: int, total_amount: float):
    print(f"[CELERY WORKER] Dispatching Order #{order_id} confirmation to {user_email} (${total_amount})")
    return {"status": "sent", "order_id": order_id}

@celery_app.task(name="notify_admin_new_issue")
def notify_admin_new_issue(ticket_id: int, subject: str, user_email: str):
    print(f"[CELERY WORKER] ALERT: Support ticket #{ticket_id} opened by {user_email}: '{subject}'")
    return {"status": "alert_dispatched", "ticket_id": ticket_id}