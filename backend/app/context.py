"""Production-ready context window backed by ChromaDB.

Stores every tutor exchange as a vector.  When building context for a new
request the service combines:

1. **Recency** – the last K messages (always included).
2. **Relevance** – up to N semantically similar older messages retrieved via
   approximate nearest-neighbour search.
3. **Summary** – a compressed one-liner about very-old context so the LLM
   keeps a sense of session history.
4. **Token budget** – the assembled context is capped at a configurable
   character limit so it fits the local model's window.
"""

import time
from typing import Dict, List, Optional
from uuid import uuid4

from .logging_config import logger

try:
    import chromadb

    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("chromadb not installed – context window in fallback mode")


class ContextWindowService:
    RECENCY_WINDOW = 4
    SEMANTIC_TOP_K = 6
    MAX_MSG_CHARS = 1200
    MAX_CONTEXT_CHARS = 8000
    RELEVANCE_THRESHOLD = 0.85
    COLLECTION_NAME = "tutor_context"

    def __init__(self, persist_dir: str = "/data/context_db") -> None:
        self._persist_dir = persist_dir
        self._client: Optional["chromadb.ClientAPI"] = None
        self._collection = None
        self._sessions: Dict[str, dict] = {}
        self._init_store()

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def _init_store(self) -> None:
        if not CHROMADB_AVAILABLE:
            return
        try:
            self._client = chromadb.PersistentClient(path=self._persist_dir)
            self._collection = self._client.get_or_create_collection(
                name=self.COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            count = self._collection.count()
            logger.info(
                "ChromaDB context store ready – %d vectors in '%s'",
                count,
                self.COLLECTION_NAME,
            )
        except Exception as exc:
            logger.warning("ChromaDB init failed (%s) – falling back to in-memory", exc)
            self._client = None
            self._collection = None

    @property
    def available(self) -> bool:
        return self._collection is not None

    # ------------------------------------------------------------------
    # Session lifecycle
    # ------------------------------------------------------------------

    def create_session(self, session_id: Optional[str] = None) -> str:
        sid = session_id or f"ctx-{uuid4().hex[:12]}"
        if sid not in self._sessions:
            self._sessions[sid] = {
                "id": sid,
                "created_at": time.time(),
                "message_count": self._count_session_messages(sid),
                "last_active": time.time(),
            }
        return sid

    def get_session(self, session_id: str) -> Optional[dict]:
        meta = self._sessions.get(session_id)
        if meta:
            meta["message_count"] = self._count_session_messages(session_id)
            return dict(meta)
        count = self._count_session_messages(session_id)
        if count:
            self._sessions[session_id] = {
                "id": session_id,
                "created_at": time.time(),
                "message_count": count,
                "last_active": time.time(),
            }
            return dict(self._sessions[session_id])
        return None

    def clear_session(self, session_id: str) -> bool:
        self._sessions.pop(session_id, None)
        if not self._collection:
            return False
        try:
            results = self._collection.get(where={"session_id": session_id})
            if results and results["ids"]:
                self._collection.delete(ids=results["ids"])
            return True
        except Exception as exc:
            logger.warning("Failed to clear session %s: %s", session_id, exc)
            return False

    def _count_session_messages(self, session_id: str) -> int:
        if not self._collection:
            return 0
        try:
            results = self._collection.get(where={"session_id": session_id})
            return len(results["ids"]) if results and results["ids"] else 0
        except Exception:
            return 0

    # ------------------------------------------------------------------
    # Message storage
    # ------------------------------------------------------------------

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        topic: str = "",
    ) -> str:
        msg_id = f"{session_id}-{uuid4().hex[:8]}"
        text = (content or "")[:self.MAX_MSG_CHARS]
        ts = time.time()

        sess = self._sessions.get(session_id)
        if sess:
            sess["message_count"] = sess.get("message_count", 0) + 1
            sess["last_active"] = ts

        if self._collection and text.strip():
            try:
                self._collection.add(
                    ids=[msg_id],
                    documents=[text],
                    metadatas=[
                        {
                            "session_id": session_id,
                            "role": role,
                            "topic": topic,
                            "timestamp": ts,
                            "char_count": len(text),
                        }
                    ],
                )
            except Exception as exc:
                logger.warning("ChromaDB add failed: %s", exc)

        return msg_id

    # ------------------------------------------------------------------
    # Context building (the core of the service)
    # ------------------------------------------------------------------

    def build_context(
        self,
        session_id: str,
        current_question: str,
        fallback_history: Optional[List[dict]] = None,
    ) -> List[dict]:
        """Return an ordered list of ``{role, content}`` dicts for the LLM.

        If ChromaDB is available the context combines recent + semantically
        relevant messages.  Otherwise it falls back to the caller-provided
        ``fallback_history`` (the old behaviour).
        """
        if not self._collection:
            return self._use_fallback(fallback_history)

        try:
            all_res = self._collection.get(
                where={"session_id": session_id},
                include=["documents", "metadatas"],
            )
        except Exception as exc:
            logger.warning("ChromaDB get failed: %s", exc)
            return self._use_fallback(fallback_history)

        if not all_res or not all_res["ids"]:
            return self._use_fallback(fallback_history)

        messages = self._unpack_results(all_res)
        messages.sort(key=lambda m: m["timestamp"])
        total = len(messages)

        if total <= self.RECENCY_WINDOW:
            return [{"role": m["role"], "content": m["content"]} for m in messages]

        recent = messages[-self.RECENCY_WINDOW:]
        recent_ids = {m["id"] for m in recent}

        semantic = self._retrieve_semantic(
            session_id, current_question, recent_ids
        )

        return self._assemble(messages, recent, semantic, total)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _retrieve_semantic(
        self,
        session_id: str,
        question: str,
        exclude_ids: set,
    ) -> List[dict]:
        if not question.strip() or not self._collection:
            return []
        try:
            n = self.SEMANTIC_TOP_K + self.RECENCY_WINDOW + 2
            results = self._collection.query(
                query_texts=[question],
                n_results=min(n, self._collection.count()),
                where={"session_id": session_id},
                include=["documents", "metadatas", "distances"],
            )
        except Exception as exc:
            logger.warning("Semantic retrieval failed: %s", exc)
            return []

        if not results or not results["ids"] or not results["ids"][0]:
            return []

        out: List[dict] = []
        for j, mid in enumerate(results["ids"][0]):
            if mid in exclude_ids:
                continue
            dist = results["distances"][0][j] if results["distances"] else 1.0
            if dist > self.RELEVANCE_THRESHOLD:
                continue
            out.append(
                {
                    "id": mid,
                    "role": results["metadatas"][0][j].get("role", "user"),
                    "content": results["documents"][0][j],
                    "timestamp": results["metadatas"][0][j].get("timestamp", 0),
                    "distance": dist,
                }
            )
            if len(out) >= self.SEMANTIC_TOP_K:
                break

        out.sort(key=lambda m: m["timestamp"])
        return out

    def _assemble(
        self,
        all_messages: List[dict],
        recent: List[dict],
        semantic: List[dict],
        total: int,
    ) -> List[dict]:
        context: List[dict] = []
        budget = self.MAX_CONTEXT_CHARS

        older_count = total - len(recent) - len(semantic)
        if older_count > 4:
            summary = self._summary_line(
                all_messages[: max(1, total - len(recent) - len(semantic))]
            )
            if summary:
                context.append({"role": "system", "content": summary})
                budget -= len(summary)

        for msg in semantic:
            text = msg["content"][: self.MAX_MSG_CHARS]
            if len(text) > budget:
                break
            context.append({"role": msg["role"], "content": text})
            budget -= len(text)

        for msg in recent:
            text = msg["content"][: self.MAX_MSG_CHARS]
            if len(text) > budget:
                text = text[:budget]
            if text:
                context.append({"role": msg["role"], "content": text})
                budget -= len(text)

        return context

    @staticmethod
    def _summary_line(older: List[dict]) -> str:
        if not older:
            return ""
        topics = {m.get("topic", "") for m in older if m.get("topic")}
        user_count = sum(1 for m in older if m.get("role") == "user")
        topics_str = ", ".join(sorted(topics)[:5]) if topics else "general mathematics"
        return (
            f"[Prior context: {len(older)} earlier messages covering {topics_str}. "
            f"Student asked {user_count} questions so far.]"
        )

    @staticmethod
    def _unpack_results(results: dict) -> List[dict]:
        out = []
        for i, mid in enumerate(results["ids"]):
            out.append(
                {
                    "id": mid,
                    "role": results["metadatas"][i].get("role", "user"),
                    "content": results["documents"][i],
                    "timestamp": results["metadatas"][i].get("timestamp", 0),
                    "topic": results["metadatas"][i].get("topic", ""),
                }
            )
        return out

    @staticmethod
    def _use_fallback(history: Optional[List[dict]]) -> List[dict]:
        if not history:
            return []
        return [
            {"role": m.get("role", "user"), "content": (m.get("content", ""))[:1200]}
            for m in history[-10:]
        ]

    # ------------------------------------------------------------------
    # Stats / diagnostics
    # ------------------------------------------------------------------

    def get_stats(self) -> dict:
        total = 0
        if self._collection:
            try:
                total = self._collection.count()
            except Exception:
                pass
        return {
            "backend": "chromadb" if self._collection else "fallback_only",
            "chromadb_available": CHROMADB_AVAILABLE,
            "total_vectors": total,
            "active_sessions": len(self._sessions),
            "config": {
                "recency_window": self.RECENCY_WINDOW,
                "semantic_top_k": self.SEMANTIC_TOP_K,
                "relevance_threshold": self.RELEVANCE_THRESHOLD,
                "max_context_chars": self.MAX_CONTEXT_CHARS,
                "max_msg_chars": self.MAX_MSG_CHARS,
                "persist_dir": self._persist_dir,
            },
        }
