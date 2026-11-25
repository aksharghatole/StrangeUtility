"""FastAPI application entry point."""

import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from .config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from .converter import ConversionError, convert_to_pdf
from .guard import ConversionGuard

app = FastAPI(
    title="Word to PDF",
    description="Convert Word documents to PDF. Self-hosted, privacy-first.",
    version="0.2.0",
)
app.add_middleware(ConversionGuard, max_body_bytes=MAX_FILE_SIZE + 1024 * 1024)


class TemporaryPDFResponse(FileResponse):
    def __init__(self, path, *, job_dir, **kwargs):
        super().__init__(path, **kwargs)
        self.job_dir = job_dir

    async def __call__(self, scope, receive, send):
        try:
            await super().__call__(scope, receive, send)
        finally:
            shutil.rmtree(self.job_dir, ignore_errors=True)


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
        response = TemporaryPDFResponse(
            pdf_path,
            job_dir=job_dir,
            media_type="application/pdf",
            filename=download_name,
            headers={"Cache-Control": "no-store"},
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
