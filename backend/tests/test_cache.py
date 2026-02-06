"""Tests for cache module."""
import time

import pytest

from app.cache import SimpleCache


@pytest.fixture
def cache():
    return SimpleCache()


class TestSimpleCache:
    def test_set_and_get(self, cache):
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_nonexistent(self, cache):
        assert cache.get("nonexistent") is None

    def test_ttl_not_expired(self, cache):
        cache.set("key1", "value1", ttl=10)
        assert cache.get("key1") == "value1"

    def test_ttl_expired(self, cache):
        cache.set("key1", "value1", ttl=1)
        time.sleep(1.1)
        assert cache.get("key1") is None

    def test_delete(self, cache):
        cache.set("key1", "value1")
        assert cache.delete("key1") is True
        assert cache.get("key1") is None

    def test_delete_nonexistent(self, cache):
        assert cache.delete("nonexistent") is False

    def test_clear(self, cache):
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.clear()
        assert cache.get("key1") is None
        assert cache.get("key2") is None

    def test_cleanup_expired(self, cache):
        cache.set("key1", "value1", ttl=1)
        cache.set("key2", "value2", ttl=10)
        time.sleep(1.1)
        removed = cache.cleanup_expired()
        assert removed == 1
        assert cache.get("key1") is None
        assert cache.get("key2") == "value2"
