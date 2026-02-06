"""Simple metrics collection for observability."""
import time
from collections import defaultdict
from typing import Dict, List


class Metrics:
    """Simple metrics collector (Prometheus-style)."""

    def __init__(self):
        self._counters: Dict[str, int] = defaultdict(int)
        self._histograms: Dict[str, List[float]] = defaultdict(list)
        self._gauges: Dict[str, float] = {}

    def inc_counter(self, name: str, value: int = 1, labels: Dict[str, str] = None) -> None:
        """Increment a counter."""
        key = self._make_key(name, labels)
        self._counters[key] += value

    def observe_histogram(self, name: str, value: float, labels: Dict[str, str] = None) -> None:
        """Add an observation to a histogram."""
        key = self._make_key(name, labels)
        self._histograms[key].append(value)
        # Keep only last 1000 observations
        if len(self._histograms[key]) > 1000:
            self._histograms[key] = self._histograms[key][-1000:]

    def set_gauge(self, name: str, value: float, labels: Dict[str, str] = None) -> None:
        """Set a gauge value."""
        key = self._make_key(name, labels)
        self._gauges[key] = value

    def _make_key(self, name: str, labels: Dict[str, str] = None) -> str:
        if not labels:
            return name
        label_str = ",".join(f'{k}="{v}"' for k, v in sorted(labels.items()))
        return f"{name}{{{label_str}}}"

    def get_prometheus_format(self) -> str:
        """Export metrics in Prometheus text format."""
        lines = []

        for key, value in self._counters.items():
            base_name = key.split("{")[0]
            lines.append(f"# TYPE {base_name} counter")
            lines.append(f"{key} {value}")

        for key, value in self._gauges.items():
            base_name = key.split("{")[0]
            lines.append(f"# TYPE {base_name} gauge")
            lines.append(f"{key} {value}")

        for key, values in self._histograms.items():
            if not values:
                continue
            name = key.split("{")[0]
            lines.append(f"# TYPE {name} histogram")
            count = len(values)
            total = sum(values)
            # Build histogram bucket key
            if "{" in key:
                bucket_key = key.replace("}", ',le="+Inf"}')
            else:
                bucket_key = key + '{le="+Inf"}'
            lines.append(f"{bucket_key} {count}")
            lines.append(f"{name}_sum {total}")
            lines.append(f"{name}_count {count}")

        return "\n".join(lines)


# Global metrics instance
metrics = Metrics()


class Timer:
    """Context manager for timing operations."""

    def __init__(self, metric_name: str, labels: Dict[str, str] = None):
        self.metric_name = metric_name
        self.labels = labels
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, *args):
        duration = time.time() - self.start_time
        metrics.observe_histogram(self.metric_name, duration, self.labels)
