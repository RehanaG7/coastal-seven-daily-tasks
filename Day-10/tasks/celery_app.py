import json
import time
from celery import Celery
import redis

from core.config import settings

# Initialize Celery
celery_app = Celery(
    "ecommerce_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    redis_backend_use_ssl=False,
    redis_backend_transport_options={"protocol": 2},
    result_backend_transport_options={"protocol": 2, "global_keyprefix": "celery_"},
    broker_transport_options={"visibility_timeout": 3600},
)

# Direct Redis connection for real-time WebSocket publishing (enforces protocol=2)
redis_client = redis.Redis.from_url(settings.REDIS_URL)

@celery_app.task(name="process_order_task", bind=True)
def process_order_task(self, order_id: int):
    """
    Simulated Asynchronous Fulfillment Pipeline:
    Executes in background worker and broadcasts events via Redis Pub/Sub.
    """
    stages = [
        {"status": "PROCESSING", "message": "Payment verified. Preparing order in warehouse.", "delay": 2},
        {"status": "PACKING", "message": "Items packaged with high-priority seal.", "delay": 3},
        {"status": "SHIPPED", "message": "Order dispatched and handed over to courier.", "delay": 2},
        {"status": "DELIVERED", "message": "Package successfully delivered to recipient.", "delay": 2}
    ]
    
    channel = f"order_updates_{order_id}"
    
    for stage in stages:
        time.sleep(stage["delay"])
        payload = json.dumps({
            "order_id": order_id,
            "status": stage["status"],
            "message": stage["message"]
        })
        redis_client.publish(channel, payload)
        
    return {"order_id": order_id, "status": "COMPLETED"}
