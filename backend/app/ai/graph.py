"""Tiny graph-orchestration primitives for the AI pipeline.

The app's LLM work was written as linear chains: do step A, then B, then C —
even when B and C only depend on A, not on each other. "Graph engineering"
reframes a pipeline as **nodes** (units of work) and **edges** (real data
dependencies): anything without an edge between it can run at the same time.

This module gives two small, dependency-free tools for that:

- ``parallel_map`` — fan a function out over independent items concurrently,
  preserving order and isolating failures. This is the workhorse for "N
  independent nodes fed by one upstream node" (e.g. all scenes of a lesson,
  which each depend only on the outline).
- ``run_dag`` — run a named node graph where each node declares which other
  nodes it depends on; independent nodes execute in parallel, and each node
  receives its dependencies' results.

Both use threads because the work is I/O-bound (it blocks on LLM/HTTP calls),
so the GIL is released while waiting. Nothing here assumes a specific model or
provider — a local Ollama call and a cloud call parallelize the same way.
"""
from __future__ import annotations

import concurrent.futures
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence

from ..logging_config import logger


def parallel_map(
    fn: Callable[[Any], Any],
    items: Sequence[Any],
    *,
    max_workers: int = 4,
    timeout: Optional[float] = None,
    default: Any = None,
) -> List[Any]:
    """Run ``fn`` over ``items`` concurrently, returning results in input order.

    A failing or timed-out item does not sink the batch: its slot is filled
    with ``default`` (typically ``None``) and the error is logged, so callers
    can retry just the missing pieces. With one item, or ``max_workers <= 1``,
    it runs inline to avoid pointless thread overhead.
    """
    n = len(items)
    if n == 0:
        return []
    workers = max(1, min(max_workers, n))
    if workers == 1:
        out = []
        for it in items:
            try:
                out.append(fn(it))
            except Exception as exc:  # noqa: BLE001 - isolate per-item failure
                logger.warning(f"parallel_map: item failed inline: {exc}")
                out.append(default)
        return out

    results: List[Any] = [default] * n
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        future_to_idx = {pool.submit(fn, item): i for i, item in enumerate(items)}
        try:
            for future in concurrent.futures.as_completed(future_to_idx, timeout=timeout):
                idx = future_to_idx[future]
                try:
                    results[idx] = future.result()
                except Exception as exc:  # noqa: BLE001
                    logger.warning(f"parallel_map: item {idx} failed: {exc}")
        except concurrent.futures.TimeoutError:
            logger.warning(f"parallel_map: batch timed out after {timeout}s; returning partial results")
            for future in future_to_idx:
                future.cancel()
    return results


class _Node:
    __slots__ = ("name", "fn", "deps")

    def __init__(self, name: str, fn: Callable[..., Any], deps: Sequence[str]):
        self.name = name
        self.fn = fn
        self.deps = tuple(deps)


def run_dag(
    nodes: Iterable[_Node] | Iterable[Dict[str, Any]],
    *,
    max_workers: int = 4,
) -> Dict[str, Any]:
    """Execute a node graph, running independent nodes in parallel.

    Each node is ``{"name", "fn", "deps"}`` (or a ``node(...)`` result). A
    node's ``fn`` is called with keyword args named after its dependencies,
    each bound to that dependency's result: ``fn(**{dep: result})``. Nodes with
    no unmet dependencies in the current wave run concurrently; the function
    returns a ``{name: result}`` map once every node has run.

    Raises ``ValueError`` on an unknown dependency or a cycle — a graph that
    can't be scheduled is a bug worth surfacing, not silently degrading.
    """
    node_list = [n if isinstance(n, _Node) else _Node(n["name"], n["fn"], n.get("deps", ())) for n in nodes]
    by_name = {n.name: n for n in node_list}
    if len(by_name) != len(node_list):
        raise ValueError("run_dag: duplicate node names")
    for n in node_list:
        for d in n.deps:
            if d not in by_name:
                raise ValueError(f"run_dag: node '{n.name}' depends on unknown node '{d}'")

    results: Dict[str, Any] = {}
    remaining = {n.name for n in node_list}
    while remaining:
        ready = [by_name[name] for name in remaining if all(d in results for d in by_name[name].deps)]
        if not ready:
            raise ValueError(f"run_dag: cycle or unresolved dependencies among {sorted(remaining)}")
        wave = parallel_map(
            lambda node: node.fn(**{d: results[d] for d in node.deps}),
            ready,
            max_workers=max_workers,
            default=None,
        )
        for node, value in zip(ready, wave):
            results[node.name] = value
            remaining.discard(node.name)
    return results


def node(name: str, fn: Callable[..., Any], deps: Sequence[str] = ()) -> _Node:
    """Build a graph node for :func:`run_dag`."""
    return _Node(name, fn, deps)
