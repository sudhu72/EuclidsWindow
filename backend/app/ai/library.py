"""Reference library (RAG) — ground the math agents in uploaded books.

Users upload PDFs / text / markdown (textbooks, lecture notes). Documents are
chunked and embedded into a persistent Chroma collection (same store the
context window uses, so it shares the existing Docker volume). Before the
tutor, lesson, or Pólya coach prompts the LLM, the top-matching excerpts are
retrieved and injected as grounding material.

RAG reduces hallucination by giving the model authoritative text to lean on;
it cannot make a small model infallible — the standing-orders skill covers
the honesty side.
"""
import io
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..logging_config import logger

try:
    import chromadb
except Exception:  # pragma: no cover
    chromadb = None

CHUNK_CHARS = 1200
CHUNK_OVERLAP = 200
COLLECTION = "library"

_UA = "EuclidsWindow-Library/1.0 (+local math tutor)"
# Link extensions to skip when crawling (binary assets), except PDFs which we
# do want to ingest.
_ASSET_RE = re.compile(
    r"\.(png|jpe?g|gif|svg|webp|ico|css|js|zip|gz|tar|mp4|mp3|wav|woff2?|ttf|xml|json)(?:$|\?)",
    re.IGNORECASE,
)


def _html_text_and_links(html: str, base_url: str):
    """Extract readable text + absolute outbound links from raw HTML.

    Regex-based to avoid a BeautifulSoup dependency — good enough for RAG text.
    """
    from urllib.parse import urljoin

    # Drop non-content blocks before stripping tags.
    cleaned = re.sub(r"<(script|style|noscript|head)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    links: List[str] = []
    for m in re.finditer(r'href\s*=\s*["\']([^"\'#>]+)', html, re.I):
        href = m.group(1).strip()
        if href.startswith(("mailto:", "javascript:", "tel:", "data:")):
            continue
        links.append(urljoin(base_url, href))
    text = re.sub(r"<[^>]+>", " ", cleaned)  # strip remaining tags
    text = re.sub(r"&(nbsp|amp|lt|gt|quot|#39|#\d+);", " ", text)  # crude entity strip
    text = re.sub(r"\s+", " ", text).strip()
    # De-dupe links preserving order.
    seen, uniq = set(), []
    for link in links:
        if link not in seen:
            seen.add(link)
            uniq.append(link)
    return text, uniq


class LibraryService:
    def __init__(self, persist_dir: str) -> None:
        self._persist_dir = persist_dir
        self._collection = None
        if chromadb is None:
            logger.warning("LibraryService: chromadb unavailable; RAG disabled")
            return
        try:
            Path(persist_dir).mkdir(parents=True, exist_ok=True)
            client = chromadb.PersistentClient(path=persist_dir)
            self._collection = client.get_or_create_collection(
                COLLECTION, metadata={"hnsw:space": "cosine"}
            )
        except Exception as exc:
            logger.error(f"LibraryService: failed to open store: {exc}")

    def is_available(self) -> bool:
        return self._collection is not None

    # ------------------------------------------------------------------
    # Ingestion
    # ------------------------------------------------------------------

    def ingest(self, filename: str, data: bytes) -> Dict[str, Any]:
        if not self.is_available():
            raise RuntimeError("Library store is unavailable")
        source = Path(filename).name
        pages = self._extract_pages(source, data)
        text_total = sum(len(t) for _, t in pages)
        if text_total < 50:
            raise ValueError("No extractable text found in the file")

        self.delete_doc(source)  # re-upload replaces
        ids: List[str] = []
        docs: List[str] = []
        metas: List[Dict[str, Any]] = []
        n = 0
        for page_no, page_text in pages:
            for chunk in self._chunks(page_text):
                ids.append(f"{source}::{n}")
                docs.append(chunk)
                metas.append({"source": source, "page": page_no, "chunk": n})
                n += 1
        for i in range(0, len(ids), 64):  # batch to keep embedding memory sane
            self._collection.add(ids=ids[i:i + 64], documents=docs[i:i + 64], metadatas=metas[i:i + 64])
        logger.info(f"Library: indexed '{source}' — {n} chunks, {text_total} chars")
        return {"source": source, "chunks": n, "characters": text_total}

    @staticmethod
    def _extract_pages(source: str, data: bytes) -> List[tuple]:
        suffix = Path(source).suffix.lower()
        if suffix == ".pdf":
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(data))
            return [(i + 1, page.extract_text() or "") for i, page in enumerate(reader.pages)]
        # txt / md / anything text-like
        return [(1, data.decode("utf-8", errors="replace"))]

    def ingest_text(self, source: str, text: str, page: int = 1) -> Dict[str, Any]:
        """Chunk + embed already-extracted text (e.g. from a web page)."""
        if not self.is_available():
            raise RuntimeError("Library store is unavailable")
        if len(text) < 50:
            raise ValueError("No extractable text found")
        self.delete_doc(source)  # re-ingest replaces
        chunks = self._chunks(text)
        ids = [f"{source}::{n}" for n in range(len(chunks))]
        metas = [{"source": source, "page": page, "chunk": n} for n in range(len(chunks))]
        for i in range(0, len(ids), 64):
            self._collection.add(ids=ids[i:i + 64], documents=chunks[i:i + 64], metadatas=metas[i:i + 64])
        logger.info(f"Library: indexed '{source}' — {len(chunks)} chunks, {len(text)} chars")
        return {"source": source, "chunks": len(chunks), "characters": len(text)}

    def fetch_url(self, url: str, timeout: float = 25.0):
        """Fetch a URL → ("pdf", bytes, []) or ("html", text, outbound_links)."""
        import httpx

        with httpx.Client(timeout=timeout, follow_redirects=True, headers={"User-Agent": _UA}) as client:
            resp = client.get(url)
            resp.raise_for_status()
            ctype = resp.headers.get("content-type", "").lower()
            path = url.lower().split("?")[0]
            if "pdf" in ctype or path.endswith(".pdf"):
                return "pdf", resp.content, []
            text, links = _html_text_and_links(resp.text, str(resp.url))
            return "html", text, links

    def ingest_url(self, url: str) -> Dict[str, Any]:
        """Fetch a single URL (PDF or web page) and index it into the library."""
        kind, payload, _ = self.fetch_url(url)
        if kind == "pdf":
            name = Path(url.split("?")[0]).name or "document.pdf"
            return self.ingest(name, payload)
        return self.ingest_text(url, payload)

    @staticmethod
    def _chunks(text: str) -> List[str]:
        text = re.sub(r"[ \t]+", " ", text).strip()
        if not text:
            return []
        out = []
        start = 0
        while start < len(text):
            end = min(start + CHUNK_CHARS, len(text))
            if end < len(text):  # break at a sentence/paragraph edge when possible
                soft = max(text.rfind("\n", start, end), text.rfind(". ", start, end))
                if soft > start + CHUNK_CHARS // 2:
                    end = soft + 1
            chunk = text[start:end].strip()
            if len(chunk) > 40:
                out.append(chunk)
            if end >= len(text):
                break
            start = max(end - CHUNK_OVERLAP, start + 1)
        return out

    # ------------------------------------------------------------------
    # Catalog
    # ------------------------------------------------------------------

    def list_docs(self) -> List[Dict[str, Any]]:
        if not self.is_available():
            return []
        got = self._collection.get(include=["metadatas"])
        counts: Dict[str, int] = {}
        for meta in got.get("metadatas") or []:
            src = meta.get("source", "?")
            counts[src] = counts.get(src, 0) + 1
        return [{"source": s, "chunks": c} for s, c in sorted(counts.items())]

    def delete_doc(self, source: str) -> int:
        if not self.is_available():
            return 0
        got = self._collection.get(where={"source": source})
        ids = got.get("ids") or []
        if ids:
            self._collection.delete(ids=ids)
        return len(ids)

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def search(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        if not self.is_available() or not query.strip():
            return []
        try:
            if self._collection.count() == 0:
                return []
            res = self._collection.query(query_texts=[query], n_results=min(k, 10))
        except Exception as exc:
            logger.warning(f"Library search failed: {exc}")
            return []
        out = []
        distances = (res.get("distances") or [[]])[0]
        for i, (doc, meta) in enumerate(zip(res.get("documents", [[]])[0], res.get("metadatas", [[]])[0])):
            out.append({
                "text": doc,
                "source": meta.get("source"),
                "page": meta.get("page"),
                "distance": distances[i] if i < len(distances) else None,
            })
        return out

    def has_strong_match(self, query: str, max_distance: float = 0.6) -> bool:
        """True when the library holds content clearly relevant to the query.

        Used to let uploaded books take precedence over the curated-topic
        keyword matcher, which can misfire on loosely related questions.
        """
        hits = self.search(query, k=1)
        if not hits:
            return False
        distance = hits[0].get("distance")
        return distance is not None and distance < max_distance

    def context_for(
        self, query: str, k: int = 3, max_chars: int = 1800, max_distance: float = 0.55
    ) -> str:
        """Formatted grounding block for prompt injection, or '' if no library.

        Only excerpts within ``max_distance`` are injected. Without this gate a
        book with no bearing on the topic still gets its nearest chunks spliced
        into the prompt and steers the answer off course — e.g. a discrete-math
        book pulls "Euler's Formula for planar graphs" (v-e+f=2) into a lesson
        on "Euler's Identity" (e^{iπ}+1=0). Measured on that book, genuinely
        on-topic excerpts land at cosine distance 0.24-0.45 while the off-topic
        Euler's-Identity query lands at 0.62-0.75, so a 0.55 gate sits in the
        empty gap and drops the false matches with margin on both sides.
        """
        hits = [
            h for h in self.search(query, k=k)
            if h.get("distance") is None or h["distance"] < max_distance
        ]
        if not hits:
            return ""
        parts = []
        used = 0
        for h in hits:
            snippet = h["text"][: max_chars - used]
            parts.append(f"[{h['source']}, p.{h['page']}] {snippet}")
            used += len(snippet)
            if used >= max_chars:
                break
        return (
            "Reference excerpts from the user's library — ground your answer in "
            "these when relevant and mention the source:\n" + "\n---\n".join(parts)
        )


_library: Optional[LibraryService] = None


def get_library() -> LibraryService:
    global _library
    if _library is None:
        base = Path(__file__).resolve().parents[2]  # backend/
        _library = LibraryService(persist_dir=str(base / "data" / "context_db"))
    return _library
