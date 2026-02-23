"""In-memory agent metrics."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional


@dataclass
class AgentMetrics:
    status: str = "idle"
    run_count: int = 0
    last_run_ms: Optional[int] = None
    last_error: Optional[str] = None
    last_run_at: Optional[str] = None


_AGENT_METRICS: Dict[str, AgentMetrics] = {}


def record_start(agent_id: str) -> None:
    metrics = _AGENT_METRICS.setdefault(agent_id, AgentMetrics())
    metrics.status = "running"
    metrics.last_run_at = datetime.utcnow().isoformat() + "Z"


def record_success(agent_id: str, elapsed_ms: int) -> None:
    metrics = _AGENT_METRICS.setdefault(agent_id, AgentMetrics())
    metrics.status = "ok"
    metrics.run_count += 1
    metrics.last_run_ms = elapsed_ms
    metrics.last_error = None


def record_error(agent_id: str, elapsed_ms: int, error: str) -> None:
    metrics = _AGENT_METRICS.setdefault(agent_id, AgentMetrics())
    metrics.status = "error"
    metrics.run_count += 1
    metrics.last_run_ms = elapsed_ms
    metrics.last_error = error


def get_metrics(agent_id: str) -> AgentMetrics:
    return _AGENT_METRICS.get(agent_id, AgentMetrics())
