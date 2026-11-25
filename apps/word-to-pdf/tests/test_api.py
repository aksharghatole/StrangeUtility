"""Tests for the HTTP API."""

from pathlib import Path

import pytest
from docx import Document
from httpx import ASGITransport, AsyncClient

from app.main import app

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
def sample_docx_bytes() -> bytes:
    """Build a small .docx in memory and return its bytes."""
    FIXTURES.mkdir(exist_ok=True)
    path = FIXTURES / "api-sample.docx"
    if not path.exists():
        doc = Document()
        doc.add_heading("API Test", level=1)
        doc.add_paragraph("This document was uploaded via HTTP.")
        doc.save(path)
    return path.read_bytes()


async def test_health(client: AsyncClient) -> None:
    res = await client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


async def test_convert_docx(client: AsyncClient, sample_docx_bytes: bytes) -> None:
    res = await client.post(
        "/api/convert",
        files={
            "file": (
                "sample.docx",
                sample_docx_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert "sample.pdf" in res.headers.get("content-disposition", "")
    assert res.content[:5] == b"%PDF-"


async def test_convert_rejects_bad_extension(client: AsyncClient) -> None:
    res = await client.post(
        "/api/convert",
        files={"file": ("virus.exe", b"MZ\x90\x00", "application/octet-stream")},
    )
    assert res.status_code == 400
    assert "Unsupported file type" in res.json()["detail"]


async def test_convert_rejects_empty_file(client: AsyncClient) -> None:
    res = await client.post(
        "/api/convert",
        files={"file": ("empty.docx", b"", "application/octet-stream")},
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


async def test_temporary_files_removed_after_download(client, sample_docx_bytes, monkeypatch, tmp_path):
    import tempfile
    from app import main

    original_mkdtemp = tempfile.mkdtemp
    jobs = []

    def create_job(**kwargs):
        path = original_mkdtemp(dir=tmp_path, **kwargs)
        jobs.append(Path(path))
        return path

    monkeypatch.setattr(main.tempfile, "mkdtemp", create_job)
    res = await client.post("/api/convert", files={"file": ("sample.docx", sample_docx_bytes)})
    assert res.status_code == 200
    assert res.headers["cache-control"] == "no-store"
    assert jobs and all(not job.exists() for job in jobs)


async def test_oversized_file_removed(client, monkeypatch, tmp_path):
    from app import main
    import tempfile

    original_mkdtemp = tempfile.mkdtemp
    jobs = []

    def create_job(**kwargs):
        path = original_mkdtemp(dir=tmp_path, **kwargs)
        jobs.append(Path(path))
        return path

    monkeypatch.setattr(main.tempfile, "mkdtemp", create_job)
    monkeypatch.setattr(main, "MAX_FILE_SIZE", 4)
    res = await client.post("/api/convert", files={"file": ("sample.txt", b"12345")})
    assert res.status_code == 413
    assert jobs and all(not job.exists() for job in jobs)
