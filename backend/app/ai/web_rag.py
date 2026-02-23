"""Lightweight web retrieval for long-tail math topics."""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import List

from ..logging_config import logger
from ..settings_store import SettingsStore


@dataclass
class RetrievedSnippet:
    title: str
    snippet: str
    url: str


class WebMathRAG:
    """Retrieves concise math context from trusted web summaries."""

    TOPIC_TRIGGERS = (
        "hamiltonian",
        "graph theory",
        "riemann",
        "conjecture",
        "category theory",
        "topology",
        "number theory",
        "spectral graph",
        "open problem",
        "latest research",
        "from web",
        "from wikipedia",
        "recent",
        "latest",
    )

    LOW_CONFIDENCE_MARKERS = (
        "i don't have a specific lesson",
        "could not generate",
        "not available",
        "no catalog lesson matched",
    )
    EXISTING_WEB_MARKERS = ("web-verified notes", "web rag notes", "**sources**")

    def __init__(self, timeout_seconds: int = 6) -> None:
        self.timeout_seconds = timeout_seconds
        self.settings_store = SettingsStore()

    def is_enabled(self) -> bool:
        effective = self.settings_store.get_effective_settings()
        return bool(effective.get("local_web_rag_enabled", True))

    def should_enrich(self, question: str, draft_answer: str) -> bool:
        if not self.is_enabled():
            return False
        q = (question or "").lower()
        a = (draft_answer or "").lower()
        if any(marker in a for marker in self.EXISTING_WEB_MARKERS):
            return False
        if any(token in q for token in self.TOPIC_TRIGGERS):
            return True
        if any(marker in a for marker in self.LOW_CONFIDENCE_MARKERS):
            return True
        return False

    def retrieve(self, question: str, limit: int = 3) -> List[RetrievedSnippet]:
        query = self._clean_query(question)
        titles = self._search_wikipedia_titles(query, limit=limit)
        snippets: List[RetrievedSnippet] = []
        for title in titles:
            summary = self._fetch_wikipedia_summary(title)
            if summary:
                snippets.append(summary)
            if len(snippets) >= limit:
                break
        return snippets

    def enrich_answer(self, question: str, answer: str, limit: int = 2) -> str:
        if not self.should_enrich(question, answer):
            return answer
        snippets = self.retrieve(question, limit=limit)
        if not snippets:
            return answer
        notes = self._build_notes(snippets)
        sources = "\n".join(f"- {s.title}: {s.url}" for s in snippets)
        return (
            (answer or "").rstrip()
            + "\n\n🌐 **Web RAG Notes**\n"
            + notes
            + "\n\n**Sources**\n"
            + sources
        ).strip()

    @staticmethod
    def _clean_query(question: str) -> str:
        q = (question or "").strip()
        q = re.sub(r"\b(explain|with visualization|visualization|show|please|now)\b", " ", q, flags=re.IGNORECASE)
        q = re.sub(r"\s+", " ", q).strip()
        return q or "mathematics"

    def _search_wikipedia_titles(self, query: str, limit: int) -> List[str]:
        params = urllib.parse.urlencode(
            {
                "action": "opensearch",
                "search": query,
                "limit": max(1, min(limit, 5)),
                "namespace": 0,
                "format": "json",
            }
        )
        url = f"https://en.wikipedia.org/w/api.php?{params}"
        try:
            with urllib.request.urlopen(url, timeout=self.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
            titles = payload[1] if isinstance(payload, list) and len(payload) > 1 else []
            return [str(title) for title in titles if title]
        except urllib.error.URLError as exc:
            logger.warning(f"Web RAG title search failed: {exc}")
            return []
        except Exception as exc:
            logger.warning(f"Web RAG title parsing failed: {exc}")
            return []

    def _fetch_wikipedia_summary(self, title: str) -> RetrievedSnippet | None:
        encoded = urllib.parse.quote(title.replace(" ", "_"))
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}"
        try:
            with urllib.request.urlopen(url, timeout=self.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
            extract = str(payload.get("extract") or "").strip()
            page_url = (
                payload.get("content_urls", {})
                .get("desktop", {})
                .get("page")
                or f"https://en.wikipedia.org/wiki/{encoded}"
            )
            if not extract:
                return None
            return RetrievedSnippet(
                title=str(payload.get("title") or title),
                snippet=extract,
                url=str(page_url),
            )
        except urllib.error.URLError:
            return None
        except Exception as exc:
            logger.warning(f"Web RAG summary parsing failed for {title}: {exc}")
            return None

    @staticmethod
    def _build_notes(snippets: List[RetrievedSnippet]) -> str:
        notes = []
        for item in snippets:
            first_sentence = item.snippet.split(".")[0].strip()
            if len(first_sentence) < 20:
                first_sentence = item.snippet[:220].strip()
            notes.append(f"- **{item.title}**: {first_sentence}.")
        return "\n".join(notes[:3])
