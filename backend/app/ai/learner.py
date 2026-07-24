"""Continuous math-book learner — once started, it keeps crawling the web for
open math books/notes and ingesting them into the reference library, so the app
keeps learning until you press Stop.

You point it at sources (URLs). Each is auto-classified:
  - github.com/...    -> traverse repos and pull book files (PDF/markdown)
  - a .pdf / web page -> ingest it, and (for pages) keep crawling that site

A single background worker walks a frontier: pop a URL, ingest it, enqueue the
links it discovers (same-domain by default), forever. It respects robots.txt and
rate-limits per host. When the frontier empties it idles, then re-seeds from the
sources so newly-published pages get picked up. Inspired by the Oracle project's
learning service.
"""
from __future__ import annotations

import json
import threading
import time
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional, Tuple
from urllib.parse import urlparse

from ..logging_config import logger
from .library import _ASSET_RE, _UA, get_library

# Curated defaults; the user can edit these in the UI.
DEFAULT_SOURCES: List[Dict[str, Any]] = [
    {"type": "url", "value": "https://www.gutenberg.org/files/33283/33283-pdf.pdf",
     "label": "Project Gutenberg — a mathematics text"},
    {"type": "github", "value": "https://github.com/topics/mathematics-textbook",
     "label": "GitHub — mathematics-textbook repos"},
]

MIN_DELAY_SECONDS = 1.5   # politeness delay between requests to the same host
IDLE_SECONDS = 300        # when the frontier drains, wait before re-seeding
MAX_VISITED = 20000       # cap the persisted visited set
SAVE_EVERY = 5            # persist stats every N ingests

# A frontier item: (url, same_domain, root_host)
Item = Tuple[str, bool, str]


class MathLearner:
    def __init__(self, state_path: Path) -> None:
        self._path = state_path
        self._state = self._load()
        self._thread: Optional[threading.Thread] = None
        self._running = False
        self._current = ""
        self._visited: set[str] = set(self._state.get("visited", []))
        self._frontier: Deque[Item] = deque()

    # --- persistence -------------------------------------------------
    def _load(self) -> Dict[str, Any]:
        if self._path.exists():
            try:
                return json.loads(self._path.read_text())
            except Exception:  # noqa: BLE001
                pass
        return {
            "sources": DEFAULT_SOURCES,
            "stats": {"ingested": 0, "chunks": 0, "errors": 0},
            "started_at": None,
            "last_activity": None,
            "visited": [],
        }

    def _save(self) -> None:
        self._state["visited"] = list(self._visited)[-MAX_VISITED:]
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(json.dumps(self._state, indent=2))

    # --- public API --------------------------------------------------
    def status(self) -> Dict[str, Any]:
        return {
            "running": self._running,
            "current": self._current,
            "queued": len(self._frontier),
            "visited": len(self._visited),
            "sources": self._state["sources"],
            "stats": self._state["stats"],
            "started_at": self._state.get("started_at"),
            "last_activity": self._state.get("last_activity"),
        }

    def start(self) -> Dict[str, Any]:
        if self._running:
            return self.status()
        self._running = True
        self._state["started_at"] = datetime.now().isoformat(timespec="seconds")
        self._thread = threading.Thread(target=self._worker, daemon=True)
        self._thread.start()
        logger.info("MathLearner: continuous crawl started")
        return self.status()

    def stop(self) -> Dict[str, Any]:
        self._running = False
        self._current = ""
        self._save()
        logger.info("MathLearner: stop requested")
        return self.status()

    def add_source(self, value: str, label: str = "") -> Dict[str, Any]:
        value = value.strip()
        stype = "github" if "github.com" in value.lower() else "url"
        if value and not any(s["value"] == value for s in self._state["sources"]):
            self._state["sources"].append({"type": stype, "value": value, "label": label or value})
            self._save()
            if self._running:
                self._seed_one({"type": stype, "value": value})
        return self.status()

    def remove_source(self, value: str) -> Dict[str, Any]:
        self._state["sources"] = [s for s in self._state["sources"] if s["value"] != value]
        self._save()
        return self.status()

    # --- crawl loop --------------------------------------------------
    def _worker(self) -> None:
        from .crawler import _Robots  # reuse robots.txt cache

        robots = _Robots()
        last_fetch: Dict[str, float] = {}
        lib = get_library()
        self._seed_all()
        n_since_save = 0
        while self._running:
            if not self._frontier:
                self._current = "idle — waiting for new content"
                self._save()
                waited = 0
                while self._running and waited < IDLE_SECONDS:
                    time.sleep(2)
                    waited += 2
                if self._running:
                    self._seed_all()
                continue

            url, same_domain, root_host = self._frontier.popleft()
            if url in self._visited:
                continue
            self._visited.add(url)
            try:
                if not robots.allowed(url):
                    continue
            except Exception:  # noqa: BLE001
                pass
            host = urlparse(url).netloc
            wait = MIN_DELAY_SECONDS - (time.monotonic() - last_fetch.get(host, 0.0))
            if wait > 0:
                time.sleep(wait)
            last_fetch[host] = time.monotonic()
            self._current = url
            try:
                kind, payload, links = lib.fetch_url(url)
                if kind == "pdf":
                    res = lib.ingest(Path(url.split("?")[0]).name or "document.pdf", payload)
                else:
                    res = lib.ingest_text(url, payload)
                self._state["stats"]["ingested"] += 1
                self._state["stats"]["chunks"] += res.get("chunks", 0)
                self._state["last_activity"] = datetime.now().isoformat(timespec="seconds")
                n_since_save += 1
            except Exception as exc:  # noqa: BLE001 - skip unreachable/empty pages
                self._state["stats"]["errors"] += 1
                links = []
                logger.info(f"MathLearner: skipped {url}: {exc}")

            # Enqueue discovered links (crawl the source's site for more books).
            for child in links:
                if child in self._visited:
                    continue
                if same_domain and urlparse(child).netloc != root_host:
                    continue
                if _ASSET_RE.search(child) and not child.lower().split("?")[0].endswith(".pdf"):
                    continue
                self._frontier.append((child, same_domain, root_host))

            if n_since_save >= SAVE_EVERY:
                self._save()
                n_since_save = 0
        self._save()

    # --- seeding -----------------------------------------------------
    def _seed_all(self) -> None:
        for source in list(self._state["sources"]):
            self._seed_one(source)

    def _seed_one(self, source: Dict[str, Any]) -> None:
        if source["type"] == "github":
            try:
                for u in _github_book_urls(source["value"]):
                    if u not in self._visited:
                        self._frontier.append((u, False, urlparse(u).netloc))
            except Exception as exc:  # noqa: BLE001
                logger.warning(f"GitHub seed failed for {source['value']}: {exc}")
        else:
            u = source["value"]
            if u not in self._visited:
                # crawl the whole source site (same-domain) for more material.
                self._frontier.append((u, True, urlparse(u).netloc))


def _github_book_urls(url: str, max_repos: int = 3, max_files: int = 6) -> List[str]:
    """Traverse GitHub to find math-book files (PDF/markdown) as raw URLs.

    Handles github.com/<owner>/<repo>, /topics/<topic>, /<org>, or a bare term.
    Unauthenticated GitHub API is rate-limited (60/hr); set GITHUB_TOKEN to raise
    it. Best-effort — returns whatever it can find.
    """
    import os

    import httpx

    parts = [p for p in urlparse(url).path.strip("/").split("/") if p]
    headers = {"User-Agent": _UA, "Accept": "application/vnd.github+json"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    repos: List[Tuple[str, str]] = []
    with httpx.Client(timeout=20.0, headers=headers, follow_redirects=True) as c:
        if len(parts) >= 2 and parts[0] not in ("topics", "search", "orgs"):
            repos = [(parts[0], parts[1])]
        elif len(parts) >= 2 and parts[0] == "topics":
            r = c.get(f"https://api.github.com/search/repositories?q=topic:{parts[1]}&sort=stars&per_page={max_repos}")
            repos = [(it["owner"]["login"], it["name"]) for it in r.json().get("items", [])[:max_repos]]
        elif len(parts) == 1:
            r = c.get(f"https://api.github.com/orgs/{parts[0]}/repos?per_page={max_repos}&sort=updated")
            if r.status_code == 200 and isinstance(r.json(), list):
                repos = [(it["owner"]["login"], it["name"]) for it in r.json()[:max_repos]]
            else:
                r = c.get(f"https://api.github.com/search/repositories?q={parts[0]}+math+book&per_page={max_repos}")
                repos = [(it["owner"]["login"], it["name"]) for it in r.json().get("items", [])[:max_repos]]
        else:
            r = c.get("https://api.github.com/search/repositories?q=mathematics+book&sort=stars&per_page=" + str(max_repos))
            repos = [(it["owner"]["login"], it["name"]) for it in r.json().get("items", [])[:max_repos]]

        out: List[str] = []
        for owner, repo in repos:
            info = c.get(f"https://api.github.com/repos/{owner}/{repo}")
            if info.status_code != 200:
                continue
            branch = info.json().get("default_branch", "main")
            tree = c.get(f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1")
            blobs = [t["path"] for t in tree.json().get("tree", []) if t.get("type") == "blob"]
            picks = [p for p in blobs if p.lower().endswith(".pdf")][:max_files]
            # README is the main doc for most repos / awesome-lists — always include it.
            readme = [p for p in blobs if p.lower() == "readme.md" or p.lower().endswith("/readme.md")]
            picks += readme[:1]
            if not picks:  # no PDFs and no README — fall back to other markdown
                picks = [p for p in blobs if p.lower().endswith(".md")][:max_files]
            out.extend(f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{p}" for p in picks)
        return out


_learner: Optional[MathLearner] = None


def get_learner() -> MathLearner:
    global _learner
    if _learner is None:
        base = Path(__file__).resolve().parents[2]  # backend/
        _learner = MathLearner(base / "data" / "learn_state.json")
    return _learner
