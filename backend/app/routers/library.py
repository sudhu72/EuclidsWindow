"""Reference library (RAG) routes: upload books, list, delete, search."""
import asyncio
from typing import Any, Dict, List

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

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
