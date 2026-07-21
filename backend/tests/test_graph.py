"""Tests for the graph-orchestration primitives."""
import time

from app.ai.graph import node, parallel_map, run_dag


def test_parallel_map_preserves_order():
    assert parallel_map(lambda x: x * x, [1, 2, 3, 4], max_workers=4) == [1, 4, 9, 16]


def test_parallel_map_empty():
    assert parallel_map(lambda x: x, []) == []


def test_parallel_map_isolates_failures():
    def f(x):
        if x == 2:
            raise ValueError("boom")
        return x * 10

    # The failing item becomes the default; the rest still succeed in order.
    assert parallel_map(f, [1, 2, 3], max_workers=3, default=None) == [10, None, 30]


def test_parallel_map_runs_concurrently():
    # Four 0.1s sleeps should finish in well under the 0.4s a serial run needs.
    start = time.perf_counter()
    parallel_map(lambda _: time.sleep(0.1), [0, 1, 2, 3], max_workers=4)
    assert time.perf_counter() - start < 0.3


def test_parallel_map_single_worker_runs_inline():
    assert parallel_map(lambda x: x + 1, [1, 2, 3], max_workers=1) == [2, 3, 4]


def test_run_dag_passes_dependency_results():
    calls = []
    graph = [
        node("outline", lambda: "topic"),
        node("a", lambda outline: f"{outline}-A", deps=["outline"]),
        node("b", lambda outline: f"{outline}-B", deps=["outline"]),
        node("assemble", lambda a, b: [a, b], deps=["a", "b"]),
    ]
    result = run_dag(graph, max_workers=4)
    assert result["assemble"] == ["topic-A", "topic-B"]


def test_run_dag_detects_cycle():
    graph = [
        node("a", lambda b: b, deps=["b"]),
        node("b", lambda a: a, deps=["a"]),
    ]
    try:
        run_dag(graph)
        assert False, "expected a cycle error"
    except ValueError as exc:
        assert "cycle" in str(exc).lower()


def test_run_dag_unknown_dependency():
    try:
        run_dag([node("a", lambda missing: missing, deps=["missing"])])
        assert False, "expected an unknown-dependency error"
    except ValueError as exc:
        assert "unknown" in str(exc).lower()
