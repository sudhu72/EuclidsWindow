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
# Chunks fetched per page when building the catalog — comfortably under
# SQLite's ~32k bound-variable ceiling that Chroma hits on a full-collection get.
CATALOG_PAGE = 2000

# Where a chunk came from. The distinction matters for `has_strong_match`: only
# material the user deliberately added should be allowed to outrank a curated
# topic. Crawled pages are background corpus — excellent for grounding an LLM
# answer, but not evidence that the curated lesson is the wrong choice.
ORIGIN_UPLOAD = "upload"  # a file the user uploaded, or a URL they named
ORIGIN_WEB = "web"  # followed by the crawler or the autonomous learner
ORIGIN_CURATED = "curated"  # tutorials shipped with the app (the cogito seed)
ORIGINS = (ORIGIN_UPLOAD, ORIGIN_WEB, ORIGIN_CURATED)

# Only the user's own material may override a curated topic. Seeded tutorials
# are deliberately NOT here: they cover the introductory ground the curated
# lessons are written for, so counting them would suppress the curated tier for
# exactly the beginner questions it exists to answer.
DELIBERATE_ORIGINS = (ORIGIN_UPLOAD,)

# ...but for grounding text, both are worth more than the background corpus:
# hand-picked material, whoever added it, beats an arbitrary crawled page.
PREFERRED_ORIGINS = (ORIGIN_UPLOAD, ORIGIN_CURATED)

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
    # Markdown links [text](url) — matters for README/awesome-list sources.
    for m in re.finditer(r"\]\((https?://[^)\s]+)\)", html):
        links.append(m.group(1))
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

    def ingest(self, filename: str, data: bytes, origin: str = ORIGIN_UPLOAD) -> Dict[str, Any]:
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
                metas.append({"source": source, "page": page_no, "chunk": n, "origin": origin})
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

    def ingest_text(
        self, source: str, text: str, page: int = 1, origin: str = ORIGIN_UPLOAD
    ) -> Dict[str, Any]:
        """Chunk + embed already-extracted text (e.g. from a web page)."""
        if not self.is_available():
            raise RuntimeError("Library store is unavailable")
        if len(text) < 50:
            raise ValueError("No extractable text found")
        self.delete_doc(source)  # re-ingest replaces
        chunks = self._chunks(text)
        ids = [f"{source}::{n}" for n in range(len(chunks))]
        metas = [
            {"source": source, "page": page, "chunk": n, "origin": origin}
            for n in range(len(chunks))
        ]
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

    def ingest_url(self, url: str, origin: str = ORIGIN_UPLOAD) -> Dict[str, Any]:
        """Fetch a single URL (PDF or web page) and index it into the library.

        Defaults to ``upload`` because naming a URL is a deliberate act; the
        crawler and learner pass ``ORIGIN_WEB`` for links they followed.
        """
        kind, payload, _ = self.fetch_url(url)
        if kind == "pdf":
            name = Path(url.split("?")[0]).name or "document.pdf"
            return self.ingest(name, payload, origin=origin)
        return self.ingest_text(url, payload, origin=origin)

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
        # Page through the collection: an unbounded get() binds one SQL variable
        # per chunk, and Chroma's SQLite backend fails with "too many SQL
        # variables" once the library grows past a few thousand chunks.
        counts: Dict[str, int] = {}
        offset = 0
        while True:
            try:
                got = self._collection.get(
                    include=["metadatas"], limit=CATALOG_PAGE, offset=offset
                )
            except Exception as exc:
                logger.warning(f"Library catalog page at offset {offset} failed: {exc}")
                break
            metadatas = got.get("metadatas") or []
            for meta in metadatas:
                src = (meta or {}).get("source", "?")
                counts[src] = counts.get(src, 0) + 1
            if len(metadatas) < CATALOG_PAGE:
                break
            offset += CATALOG_PAGE
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

    def search(
        self, query: str, k: int = 4, where: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Nearest chunks to ``query``; ``where`` filters on chunk metadata."""
        if not self.is_available() or not query.strip():
            return []
        try:
            if self._collection.count() == 0:
                return []
            res = self._collection.query(
                query_texts=[query], n_results=min(k, 10), where=where or None
            )
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
        """True when *deliberately added* material clearly covers the query.

        Used to let the user's own books take precedence over the curated-topic
        keyword matcher, which can misfire on loosely related questions.

        Only chunks whose origin is in ``DELIBERATE_ORIGINS`` are considered.
        Crawled pages are excluded on purpose: once the crawler had filled the
        store with ~600 documents of general math corpus, every math question
        cleared the distance bar (measured: "define a triangle" 0.403, "7 times
        8" 0.557, and even a nonsense string 0.607), so this returned True
        universally and silently disabled the entire curated tier. Distance to
        the nearest chunk measures topic coverage, not whether the library is a
        better answer than a hand-written lesson — filtering by origin restores
        the original intent and stays correct however large the corpus grows.

        Chunks indexed before origin tracking carry no ``origin`` and are
        therefore treated as background corpus; re-uploading a document marks it
        deliberate again.

        Seeded tutorials (``ORIGIN_CURATED``) are excluded for the same reason,
        found the same way: they cover introductory ground thoroughly, so once
        the cogito seed grew to 48 tutorials this returned True for "what is a
        triangle" (0.43) and "explain fractions to a child" (0.464) and
        suppressed the curated lesson for precisely the beginner questions it
        was written for. They still ground the answer — see
        ``PREFERRED_ORIGINS`` in ``context_for`` — they just no longer veto the
        curated tier.
        """
        hits = self.search(query, k=1, where={"origin": {"$in": list(DELIBERATE_ORIGINS)}})
        if not hits:
            return False
        distance = hits[0].get("distance")
        return distance is not None and distance < max_distance

    def context_for(
        self,
        query: str,
        k: int = 3,
        max_chars: int = 1800,
        max_distance: float = 0.55,
        reserved: int = 1,
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

        ``reserved`` slots of the ``k`` budget are filled from
        ``PREFERRED_ORIGINS`` first. Nearest-neighbour ranking alone is a
        popularity contest that hand-picked material loses on volume: the
        crawler grew the corpus past 80k chunks, after which a tutorial written
        for the question ranked 3rd or 4th behind textbook PDFs and — with
        callers passing k=2 or k=3 — was never injected at all. Reserving a slot
        restores it without silencing the corpus, which still fills the rest.

        Reserved hits face the same distance gate, so an off-topic tutorial is
        still dropped: this changes precedence among relevant material, it does
        not lower the bar for relevance.
        """
        general = self.search(query, k=k)
        preferred = (
            self.search(
                query, k=reserved, where={"origin": {"$in": list(PREFERRED_ORIGINS)}}
            )
            if reserved > 0
            else []
        )
        seen = set()
        merged = []
        for h in [*preferred, *general]:
            key = (h.get("source"), h.get("page"), h["text"][:80])
            if key in seen:
                continue
            seen.add(key)
            merged.append(h)
        hits = [
            h for h in merged
            if h.get("distance") is None or h["distance"] < max_distance
        ][:k]
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
