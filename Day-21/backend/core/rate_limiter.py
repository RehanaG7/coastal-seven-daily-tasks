from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Global Rate Limiter: tracks requests per remote IP address
# headers_enabled=False allows standard FastAPI dict/Pydantic returns
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["120/minute"],
    headers_enabled=False,
    storage_uri="memory://"
)

def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Friendly, OWASP-compliant JSON response for rate-limited requests."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Rate limit exceeded: {exc.detail}. Please slow down.",
            "error_code": "RATE_LIMIT_EXCEEDED"
        },
        headers={"Retry-After": "60"}
    )
