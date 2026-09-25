import time
from core.celery_app import celery_app

@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 3},
    retry_backoff=True
)
def generate_monthly_report(self, user_id: int):
    """Simulates a heavy CPU/IO workload with automatic retries."""
    try:
        time.sleep(4)  # Simulate report aggregation / PDF compilation
        return {
            "status": "COMPLETED",
            "user_id": user_id,
            "report_url": f"https://cdn.example.com/reports/user_{user_id}.pdf"
        }
    except Exception as exc:
        raise self.retry(exc=exc)

@celery_app.task
def periodic_cleanup_task():
    """Triggered periodically by Celery Beat."""
    return {"status": "Periodic cache & session cleanup executed"}