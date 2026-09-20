"""The library override must only respect deliberately-added material.

`has_strong_match` decides whether the user's library outranks a curated topic.
It used to consider every chunk, so once the crawler had filled the store with
general math corpus it returned True for essentially any question — silently
disabling the whole curated tier (the only instant response path). These tests
lock in that crawled pages cannot trigger the override.
"""
import pytest

from app.ai.library import (
    DELIBERATE_ORIGINS,
    ORIGIN_UPLOAD,
    ORIGIN_WEB,
    LibraryService,
)


@pytest.fixture()
def library(tmp_path):
    lib = LibraryService(persist_dir=str(tmp_path / "lib"))
    if not lib.is_available():
        pytest.skip("chromadb unavailable")
    return lib


TEXT = (
    "The determinant of a 2x2 matrix measures how much the linear map scales "
    "area. A determinant of zero means the map collapses the plane onto a line, "
    "so the transformation is not invertible and no inverse matrix exists. "
) * 6
QUERY = "what does a matrix determinant measure?"


def test_web_origin_never_triggers_the_override(library):
    """Crawled corpus grounds answers but must not outrank a curated topic."""
    library.ingest_text("https://example.com/linear-algebra", TEXT, origin=ORIGIN_WEB)
    assert library.search(QUERY, k=1), "crawled text should still be retrievable"
    assert library.has_strong_match(QUERY) is False


def test_uploaded_origin_triggers_the_override(library):
    library.ingest_text("linear_algebra_notes.md", TEXT, origin=ORIGIN_UPLOAD)
    assert library.has_strong_match(QUERY) is True


def test_upload_is_the_default_origin(library):
    """Naming a file or URL is deliberate; only crawlers opt into ORIGIN_WEB."""
    library.ingest_text("notes.md", TEXT)
    assert library.has_strong_match(QUERY) is True


def test_untagged_legacy_chunks_are_treated_as_corpus(library):
    """Chunks indexed before origin tracking must not resurrect the bug.

    Written straight to the collection without an ``origin`` key — Chroma's
    ``update`` merges metadata rather than replacing it, so a key cannot be
    removed after the fact.
    """
    library._collection.add(
        ids=["legacy::0"],
        documents=[TEXT],
        metadatas=[{"source": "legacy.md", "page": 1, "chunk": 0}],
    )
    assert library.search(QUERY, k=1), "legacy chunk should still be retrievable"
    assert library.has_strong_match(QUERY) is False


def test_unrelated_query_does_not_match(library):
    library.ingest_text("notes.md", TEXT, origin=ORIGIN_UPLOAD)
    assert library.has_strong_match("what is the capital of France?") is False


def test_deliberate_origins_excludes_web():
    assert ORIGIN_UPLOAD in DELIBERATE_ORIGINS
    assert ORIGIN_WEB not in DELIBERATE_ORIGINS
