"""
Day 24 DevOps / AWS Focus: Sentry Real-Time Error Tracking Integration
Captures unhandled exceptions, performance transactions, and runtime crashes.
Operates gracefully in both production (with real SENTRY_DSN) and local/CI environments.
"""

import os
import logging
from typing import Optional

logger = logging.getLogger("sentry_integration")

SENTRY_ENABLED = False


def init_sentry(
    dsn: Optional[str] = None,
    environment: str = "production",
    release: str = "rmart-backend@1.0.0",
    traces_sample_rate: float = 0.2,
) -> bool:
    """
    Initializes the Sentry SDK for FastAPI and Celery.
    Returns True if Sentry was initialized, False if skipped.
    """
    global SENTRY_ENABLED
    target_dsn = dsn or os.getenv("SENTRY_DSN", "").strip()

    if not target_dsn:
        logger.info("SENTRY_DSN is not configured; running in safe local/offline mode.")
        SENTRY_ENABLED = False
        return False

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        sentry_sdk.init(
            dsn=target_dsn,
            environment=environment,
            release=release,
            traces_sample_rate=traces_sample_rate,
            profiles_sample_rate=0.1,
            send_default_pii=False,
            integrations=[
                StarletteIntegration(transaction_style="endpoint"),
                FastApiIntegration(transaction_style="endpoint"),
            ],
        )
        SENTRY_ENABLED = True
        logger.info(f"Sentry SDK successfully initialized for environment: {environment}")
        return True
    except Exception as e:
        logger.warning(f"Failed to initialize Sentry SDK: {e}. Continuing without Sentry.")
        SENTRY_ENABLED = False
        return False


def capture_exception(exc: Exception) -> Optional[str]:
    """
    Captures an exception and forwards it to Sentry if active.
    Returns the event ID or None.
    """
    if SENTRY_ENABLED:
        try:
            import sentry_sdk
            return sentry_sdk.capture_exception(exc)
        except Exception:
            pass
    return None


def capture_message(message: str, level: str = "info") -> Optional[str]:
    """
    Captures an informational or warning message to Sentry.
    """
    if SENTRY_ENABLED:
        try:
            import sentry_sdk
            return sentry_sdk.capture_message(message, level=level)
        except Exception:
            pass
    return None
