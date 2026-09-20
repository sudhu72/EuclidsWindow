#!/usr/bin/env python3
"""Seed the Euclid's Window RAG library with the "cogito" Feynman tutorials.

Every Markdown tutorial in the cogito repo is uploaded to the running app's
`POST /api/library/upload` endpoint, which chunks + embeds it into the Chroma
"library" collection. Once seeded, the tutor, lesson pipeline, and Solve coach
cite this content when a question strongly matches it.

Stdlib only — runs on the host against http://localhost:8010. Uploading the same
file again replaces its existing chunks (the endpoint delete-and-re-ingests), so
this script is safe to re-run.

Usage:
    python3 scripts/seed_cogito_library.py
    python3 scripts/seed_cogito_library.py --cogito ~/Research/cogito --base-url http://localhost:8010
    python3 scripts/seed_cogito_library.py --skip-dirs pydata python
"""

from __future__ import annotations

import argparse
import mimetypes  # noqa: F401  (kept for clarity; multipart is built by hand)
import os
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

DEFAULT_COGITO = Path(os.path.expanduser("~/Research/cogito"))
DEFAULT_BASE_URL = "http://localhost:8010"

# READMEs are navigational indexes, not teaching content — skip them.
SKIP_NAMES = {"readme.md"}


def find_markdown(cogito_dir: Path, skip_dirs: set[str] | None = None) -> list[Path]:
    """All tutorial .md files, optionally excluding whole top-level tracks.

    ``skip_dirs`` matches the *first* path component under ``cogito_dir``
    (e.g. ``pydata``, ``python``) — an opt-in filter for a scoped sync, not a
    permanent exclusion; omitting it (the default) preserves the original
    full-repo behavior.
    """
    skip_dirs = skip_dirs or set()
    files = [p for p in sorted(cogito_dir.rglob("*.md")) if ".git" not in p.parts]
    files = [p for p in files if p.name.lower() not in SKIP_NAMES]
    if skip_dirs:
        files = [p for p in files if p.relative_to(cogito_dir).parts[0] not in skip_dirs]
    return files


def upload(base_url: str, path: Path) -> tuple[bool, str]:
    """POST a single Markdown file as multipart/form-data to the library."""
    boundary = f"----cogito{uuid.uuid4().hex}"
    data = path.read_bytes()
    # A repo-relative-ish name keeps sources readable in the library catalog.
    filename = path.name
    body = b"".join([
        f"--{boundary}\r\n".encode(),
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode(),
        b"Content-Type: text/markdown\r\n\r\n",
        data,
        f"\r\n--{boundary}\r\n".encode(),
        # Marks these as shipped-with-the-app material rather than something the
        # user chose to add. They are preferred over the crawled corpus when
        # grounding an answer, but do not override a curated lesson.
        b'Content-Disposition: form-data; name="origin"\r\n\r\ncurated',
        f"\r\n--{boundary}--\r\n".encode(),
    ])
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/library/upload",
        data=body,
        method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            payload = resp.read().decode("utf-8", "replace")
            return True, payload
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        return False, f"HTTP {exc.code}: {detail}"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--cogito", type=Path, default=DEFAULT_COGITO,
                    help=f"Path to the cogito repo (default: {DEFAULT_COGITO})")
    ap.add_argument("--base-url", default=DEFAULT_BASE_URL,
                    help=f"Base URL of the running app (default: {DEFAULT_BASE_URL})")
    ap.add_argument("--skip-dirs", nargs="+", default=[],
                    help="Top-level cogito directories to exclude from this run (e.g. pydata python)")
    args = ap.parse_args()

    cogito_dir: Path = args.cogito.expanduser()
    if not cogito_dir.is_dir():
        print(f"error: cogito directory not found: {cogito_dir}", file=sys.stderr)
        return 2

    files = find_markdown(cogito_dir, skip_dirs=set(args.skip_dirs))
    if not files:
        print(f"error: no Markdown tutorials found under {cogito_dir}", file=sys.stderr)
        return 2

    print(f"Seeding {len(files)} tutorials from {cogito_dir} → {args.base_url}\n")
    ok = 0
    for path in files:
        rel = path.relative_to(cogito_dir)
        success, info = upload(args.base_url, path)
        if success:
            ok += 1
            print(f"  ✓ {rel}  {info}")
        else:
            print(f"  ✗ {rel}  {info}", file=sys.stderr)

    print(f"\nDone: {ok}/{len(files)} tutorials ingested into the library.")
    return 0 if ok == len(files) else 1


if __name__ == "__main__":
    raise SystemExit(main())
