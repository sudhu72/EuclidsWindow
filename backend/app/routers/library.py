"""Reference library (RAG) routes: upload books, ingest URLs, crawl, search."""
import asyncio
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from ..ai.crawler import get_crawler
from ..ai.library import get_library

router = APIRouter(tags=["library"])

ALLOWED_SUFFIXES = (".pdf", ".txt", ".md", ".markdown")
MAX_UPLOAD_BYTES = 50 * 1024 * 1024


class LibraryDoc(BaseModel):
    source: str
    chunks: int


class LibraryIngestResponse(BaseModel):
    source: str
    chunks: int
    characters: int


class IngestURLRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2000)


class CrawlRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2000)
    depth: int = Field(2, ge=0, le=3)
    breadth: int = Field(5, ge=1, le=20)
    same_domain: bool = True
    max_pages: int = Field(20, ge=1, le=100)


@router.post("/api/library/upload", response_model=LibraryIngestResponse)
async def library_upload(file: UploadFile = File(...)) -> LibraryIngestResponse:
    name = file.filename or "upload"
    if not name.lower().endswith(ALLOWED_SUFFIXES):
        raise HTTPException(status_code=422, detail="Upload a .pdf, .txt, or .md file.")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 50 MB limit.")
    library = get_library()
    if not library.is_available():
        raise HTTPException(status_code=503, detail="Library store is unavailable.")
    try:
        result = await asyncio.to_thread(library.ingest, name, data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to index file: {exc}") from exc
    return LibraryIngestResponse(**result)


@router.post("/api/library/url", response_model=LibraryIngestResponse)
async def library_ingest_url(req: IngestURLRequest) -> LibraryIngestResponse:
    """Fetch a single URL (a web page or a PDF) and index it into the library."""
    library = get_library()
    if not library.is_available():
        raise HTTPException(status_code=503, detail="Library store is unavailable.")
    if not req.url.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=422, detail="Enter an http(s) URL.")
    try:
        result = await asyncio.to_thread(library.ingest_url, req.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch/index URL: {exc}") from exc
    return LibraryIngestResponse(**result)


@router.post("/api/library/crawl")
async def library_crawl(req: CrawlRequest) -> Dict[str, Any]:
    """Start a background crawl from a URL, ingesting linked pages/PDFs."""
    if not get_library().is_available():
        raise HTTPException(status_code=503, detail="Library store is unavailable.")
    if not req.url.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=422, detail="Enter an http(s) URL.")
    st = get_crawler().start(req.url, req.depth, req.breadth, req.same_domain, req.max_pages)
    return {"started": True, "status": st}


@router.get("/api/library/crawl/status")
async def library_crawl_status(url: Optional[str] = None) -> Dict[str, Any]:
    """Poll crawl progress; pass ?url=<root> for a specific job."""
    return {"crawls": get_crawler().status(url)}


@router.get("/api/library/docs", response_model=List[LibraryDoc])
async def library_docs() -> List[LibraryDoc]:
    return [LibraryDoc(**d) for d in get_library().list_docs()]


@router.delete("/api/library/docs/{source}")
async def library_delete(source: str) -> Dict[str, Any]:
    removed = get_library().delete_doc(source)
    if not removed:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"source": source, "removed_chunks": removed}


@router.get("/api/library/search")
async def library_search(q: str, k: int = 4) -> Dict[str, Any]:
    return {"query": q, "results": get_library().search(q, k=k)}
