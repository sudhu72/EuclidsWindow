"""Math Map service for interactive topic exploration."""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "math_map.json"


class MathMapService:
    """Manages the interactive math map data."""

    def __init__(self):
        self._data = self._load_data()

    def _load_data(self) -> Dict[str, Any]:
        with DATA_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)

    def get_full_map(self) -> Dict[str, Any]:
        """Return the complete math map data."""
        return self._data

    def get_categories(self) -> List[Dict[str, Any]]:
        """Return list of categories with basic info."""
        return [
            {
                "id": cat["id"],
                "name": cat["name"],
                "color": cat["color"],
                "topic_count": len(cat["topics"]),
            }
            for cat in self._data["categories"]
        ]

    def get_category(self, category_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific category with its topics."""
        for cat in self._data["categories"]:
            if cat["id"] == category_id:
                return cat
        return None

    def get_topic(self, topic_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific topic with its prompts."""
        for cat in self._data["categories"]:
            for topic in cat["topics"]:
                if topic["id"] == topic_id:
                    return {
                        **topic,
                        "category_id": cat["id"],
                        "category_name": cat["name"],
                        "category_color": cat["color"],
                    }
        return None

    def search_topics(self, query: str) -> List[Dict[str, Any]]:
        """Search topics by name or prompt content."""
        results = []
        query_lower = query.lower()
        for cat in self._data["categories"]:
            for topic in cat["topics"]:
                # Check topic name
                if query_lower in topic["name"].lower():
                    results.append({
                        **topic,
                        "category_id": cat["id"],
                        "category_name": cat["name"],
                        "category_color": cat["color"],
                    })
                    continue
                # Check prompts
                for prompt in topic["prompts"]:
                    if query_lower in prompt.lower():
                        results.append({
                            **topic,
                            "category_id": cat["id"],
                            "category_name": cat["name"],
                            "category_color": cat["color"],
                        })
                        break
        return results
