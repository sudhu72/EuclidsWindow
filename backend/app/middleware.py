"""Middleware for metrics collection."""
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from .metrics import metrics


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
