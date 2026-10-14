from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    OWASP API Security Top 10 Hardening Middleware:
    Injects enterprise security headers on every outgoing HTTP response.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        
        # 1. Prevent Clickjacking (disallow embedding in iframes)
        response.headers["X-Frame-Options"] = "DENY"
        
        # 2. Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # 3. Cross-Site Scripting (XSS) filter protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # 4. Enforce strict HTTPS transport
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # 5. Prevent referrer leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # 6. Restrict dangerous browser features
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        
        return response
