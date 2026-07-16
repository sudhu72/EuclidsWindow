import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from .models import VisualizationPayload, VisualizationType


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "demo_topics.json"

_WORD_BOUNDARY_CACHE: Dict[str, re.Pattern] = {}


def _keyword_matches(keyword: str, text: str) -> bool:
    """Match keyword in text using word boundaries for short keywords."""
    if len(keyword) <= 5:
        pattern = _WORD_BOUNDARY_CACHE.get(keyword)
        if pattern is None:
            pattern = re.compile(r"\b" + re.escape(keyword) + r"\b")
            _WORD_BOUNDARY_CACHE[keyword] = pattern
        return pattern.search(text) is not None
    return keyword in text


class TopicCatalog:
    def __init__(self) -> None:
        self._topics = self._load_topics()

    def _load_topics(self) -> List[Dict[str, Any]]:
        with DATA_PATH.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        return payload.get("topics", [])

    # Filler words that don't count as question content when judging whether
    # a keyword match actually explains the question.
    _STOPWORDS = frozenset(
        "what is are the a an of my me i you your in on at to for and or does do "
        "did how why when where which can could would should say says said state "
        "tell explain about it its this that these those with have has had please "
        "exactly precise precisely according textbook book uploaded give show some "
        "any one more most be was were will not no yes there here between from by "
        "as if then than so such into out up down over under work works".split()
    )

    def match_topic(self, message: str) -> Optional[Dict[str, Any]]:
        text = message.lower()
        best_match = None
        best_score = (0, 0, 0)
        best_keywords: List[str] = []
        for topic in self._topics:
            longest_kw = 0
            hit_count = 0
            total_kw_len = 0
            matched: List[str] = []
            for keyword in topic.get("keywords", []):
                if keyword and _keyword_matches(keyword, text):
                    hit_count += 1
                    total_kw_len += len(keyword)
                    matched.append(keyword)
                    if len(keyword) > longest_kw:
                        longest_kw = len(keyword)
            if hit_count > 0:
                score = (hit_count, longest_kw, total_kw_len)
                if score > best_score:
                    best_score = score
                    best_match = topic
                    best_keywords = matched
        if best_match is not None and not self._is_confident_match(text, best_keywords):
            return None
        return best_match

    def _is_confident_match(self, text: str, matched_keywords: List[str]) -> bool:
        """Reject matches where a lone generic keyword hijacks the question.

        A match is confident when a multi-word phrase matched, two or more
        keywords matched, a single highly specific word matched, or the
        matched keywords cover most of the question's content words (so
        "what is a graph?" still hits the graph topic, while "zeros of the
        Riemann zeta function" no longer hits the functions topic on the
        word "function" alone).
        """
        if any(" " in kw for kw in matched_keywords):
            return True
        if len(matched_keywords) >= 2:
            return True
        if any(len(kw) >= 9 for kw in matched_keywords):
            return True
        content_words = {
            w for w in re.findall(r"[a-z0-9'^+=/-]+", text)
            if len(w) >= 2 and w not in self._STOPWORDS
        }
        if not content_words:
            return False
        covered = sum(
            1
            for w in content_words
            if any(kw in w or w in kw for kw in matched_keywords)
        )
        return covered / len(content_words) >= 0.3

    _LEVEL_CONTENT_KEYS = {
        "kids": "kids_content",
        "teen": "teen_content",
        "college": "college_content",
        "adult": "adult_content",
    }

    @staticmethod
    def get_response_for_level(topic: Dict[str, Any], learner_level: str) -> str:
        """Return level-specific curated content if available, else response_text."""
        level = (learner_level or "").strip().lower()
        key = TopicCatalog._LEVEL_CONTENT_KEYS.get(level)
        if key:
            curated = topic.get(key)
            if curated:
                return curated
        return topic.get("response_text", "")

    def build_visualization(self, topic: Dict[str, Any]) -> Optional[VisualizationPayload]:
        viz = topic.get("visualization")
        if not viz:
            return None
        return VisualizationPayload(
            viz_id=viz["viz_id"],
            viz_type=VisualizationType(viz["viz_type"]),
            title=viz["title"],
            data=viz.get("data", {}),
        )
