import logging
from tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="send_order_confirmation_email")
def send_order_confirmation_email(
    user_email: str, order_id: int, total_amount: float
) -> str:
    msg = (
        f"Order #{order_id} confirmed for {user_email}. "
        f"Total: ${total_amount:.2f}"
    )
    logger.info(f"[CELERY EMAIL WORKER] {msg}")
    return msg
