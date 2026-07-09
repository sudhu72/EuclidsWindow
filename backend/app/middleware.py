"""Middleware for metrics collection and rate limiting."""
import time
from collections import defaultdict, deque
from typing import Callable, Deque, Dict, Tuple

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .metrics import metrics


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limit for expensive AI generation endpoints.

    LLM/diffusion/Manim requests hold CPU or GPU for seconds to minutes, so
    a single client hammering them can wedge the whole app.
    """

    LIMITED_PREFIX = "/api/ai/"
    MAX_REQUESTS = 30
    WINDOW_SECONDS = 60.0

    def __init__(self, app) -> None:
        super().__init__(app)
        self._hits: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "POST" and request.url.path.startswith(self.LIMITED_PREFIX):
            client_ip = request.client.host if request.client else "unknown"
            key = (client_ip, self.LIMITED_PREFIX)
            now = time.monotonic()
            hits = self._hits[key]
            while hits and now - hits[0] > self.WINDOW_SECONDS:
                hits.popleft()
            if len(hits) >= self.MAX_REQUESTS:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many generation requests; slow down."},
                    headers={"Retry-After": str(int(self.WINDOW_SECONDS))},
                )
            hits.append(now)
        return await call_next(request)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect request metrics."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # Track active requests
        metrics.set_gauge(
            "euclids_window_active_requests",
            metrics._gauges.get("euclids_window_active_requests", 0) + 1,
        )

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception:
            status_code = 500
            raise
        finally:
            duration = time.time() - start_time

            # Record request metrics
            labels = {
                "method": request.method,
                "endpoint": request.url.path,
                "status": str(status_code),
            }

            metrics.inc_counter("euclids_window_requests_total", labels=labels)
            metrics.observe_histogram("euclids_window_request_duration_seconds", duration, labels)

            # Decrement active requests
            metrics.set_gauge(
                "euclids_window_active_requests",
                max(0, metrics._gauges.get("euclids_window_active_requests", 1) - 1),
            )

        return response
