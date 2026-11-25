"""FastAPI application entry point."""

import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.background import BackgroundTask

from .config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from .converter import ConversionError, convert_to_pdf

app = FastAPI(
    title="Word to PDF",
    description="Convert Word documents to PDF. Self-hosted, privacy-first.",
    version="0.1.0",
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    """Liveness check. Returns OK if the app is running."""
    return {"status": "ok"}


@app.post("/api/convert")
async def convert(file: UploadFile = File(...)) -> FileResponse:
    """Convert an uploaded document to PDF and return it."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    job_dir = Path(tempfile.mkdtemp(prefix="word-to-pdf-"))
    input_path = job_dir / f"input{ext}"
    delivered = False
    try:
        size = 0
        with input_path.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="File too large. Max 20 MB.")
                output.write(chunk)
        if not size:
            raise HTTPException(status_code=400, detail="File is empty.")
        try:
            pdf_path = await convert_to_pdf(input_path, output_dir=job_dir)
        except ConversionError as exc:
            raise HTTPException(status_code=500, detail="Document conversion failed.") from exc
        download_name = Path(file.filename).with_suffix(".pdf").name
        response = FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=download_name,
            headers={"Cache-Control": "no-store"},
            background=BackgroundTask(shutil.rmtree, job_dir, ignore_errors=True),
        )
        delivered = True
        return response
    finally:
        try:
            await file.close()
        finally:
            if not delivered:
                shutil.rmtree(job_dir, ignore_errors=True)


# ---- Frontend --------------------------------------------------------------

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"


@app.get("/")
async def root() -> RedirectResponse:
    """Send visitors to the app."""
    return RedirectResponse(url="/app/")


if FRONTEND_DIR.exists():
    app.mount(
        "/app",
        StaticFiles(directory=FRONTEND_DIR, html=True),
        name="frontend",
    )
