"""Web crawler for the reference library — depth/breadth link traversal.

Given a starting URL, crawl breadth-first up to a depth and per-page breadth,
ingesting each page (and any linked PDFs) into the RAG library store. Runs in a
background thread with in-memory status polling. Ported/simplified from the
Oracle project's crawler; respects robots.txt and rate-limits per host.
"""
from __future__ import annotations

import threading
import time
from collections import deque
from typing import Any, Dict, Optional
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

from ..logging_config import logger
from .library import _ASSET_RE, _UA, get_library

MIN_DELAY_SECONDS = 1.0  # politeness delay between requests to the same host


class _Robots:
    """Tiny per-host robots.txt cache using the stdlib parser."""

    def __init__(self) -> None:
        self._cache: Dict[str, Optional[RobotFileParser]] = {}

    def allowed(self, url: str) -> bool:
        parts = urlparse(url)
        host = f"{parts.scheme}://{parts.netloc}"
        if host not in self._cache:
            rp: Optional[RobotFileParser] = RobotFileParser()
            try:
                import httpx

                with httpx.Client(timeout=8.0, headers={"User-Agent": _UA}) as c:
                    resp = c.get(f"{host}/robots.txt", follow_redirects=True)
                if resp.status_code == 200:
                    rp.parse(resp.text.splitlines())
                else:
                    rp = None  # no robots.txt → allow
            except Exception:  # noqa: BLE001 - unreachable robots.txt → allow (standard)
                rp = None
            self._cache[host] = rp
        rp = self._cache[host]
        return rp is None or rp.can_fetch(_UA, url)


class CrawlManager:
    def __init__(self) -> None:
        self._jobs: Dict[str, Dict[str, Any]] = {}

    def status(self, url: Optional[str] = None) -> Any:
        if url:
            return self._jobs.get(url, {})
        return self._jobs

    def start(
        self,
        url: str,
        depth: int = 2,
        breadth: int = 5,
        same_domain: bool = True,
        max_pages: int = 20,
    ) -> Dict[str, Any]:
        st: Dict[str, Any] = {
            "url": url, "status": "running", "pages": 0, "ingested": 0,
            "chunks": 0, "skipped_robots": 0, "current": "", "done": False,
            "error": None, "max_pages": max_pages,
        }
        self._jobs[url] = st
        threading.Thread(
            target=self._run,
            args=(url, max(0, depth), max(1, breadth), same_domain, max(1, max_pages), st),
            daemon=True,
        ).start()
        return st

    def _run(self, root, depth, breadth, same_domain, max_pages, st) -> None:
        try:
            lib = get_library()
            robots = _Robots()
            root_host = urlparse(root).netloc
            visited: set[str] = set()
            last_fetch: Dict[str, float] = {}
            queue: deque = deque([(root, 0)])
            while queue and st["pages"] < max_pages:
                url, level = queue.popleft()
                if url in visited:
                    continue
                visited.add(url)
                if not robots.allowed(url):
                    st["skipped_robots"] += 1
                    continue
                host = urlparse(url).netloc
                wait = MIN_DELAY_SECONDS - (time.monotonic() - last_fetch.get(host, 0.0))
                if wait > 0:
                    time.sleep(wait)
                last_fetch[host] = time.monotonic()
                st["current"] = url
                try:
                    kind, payload, links = lib.fetch_url(url)
                    if kind == "pdf":
                        from pathlib import Path
                        res = lib.ingest(Path(url.split("?")[0]).name or "document.pdf", payload)
                    else:
                        res = lib.ingest_text(url, payload)
                    st["pages"] += 1
                    st["ingested"] += 1
                    st["chunks"] += res.get("chunks", 0)
                except Exception as exc:  # noqa: BLE001 - skip unreachable/empty pages
                    logger.info(f"Crawler: skipped {url}: {exc}")
                    st["pages"] += 1
                    links = []
                if level < depth:
                    followed = 0
                    for child in links:
                        if followed >= breadth or st["pages"] + len(queue) >= max_pages:
                            break
                        if child in visited:
                            continue
                        if same_domain and urlparse(child).netloc != root_host:
                            continue
                        # Follow HTML pages and PDFs; skip other binary assets.
                        if _ASSET_RE.search(child) and not child.lower().split("?")[0].endswith(".pdf"):
                            continue
                        queue.append((child, level + 1))
                        followed += 1
            st["status"] = "blocked" if st["pages"] == 0 and st["skipped_robots"] else "success"
        except Exception as exc:  # noqa: BLE001
            st["error"] = f"{type(exc).__name__}: {exc}"
            st["status"] = "error"
        finally:
            st["done"] = True
            logger.info(f"Crawler done: {root} — {st['ingested']} pages, {st['chunks']} chunks")


_manager: Optional[CrawlManager] = None


def get_crawler() -> CrawlManager:
    global _manager
    if _manager is None:
        _manager = CrawlManager()
    return _manager
