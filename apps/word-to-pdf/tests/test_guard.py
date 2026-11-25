"""Exercise ASGI resource admission before parsing multipart form data."""
import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from app.guard import ConversionGuard
from app.main import app


async def test_declared_oversize_rejected_before_receiving():
    called = False

    async def downstream(scope, receive, send):
        nonlocal called
        called = True

    guard = ConversionGuard(downstream, max_body_bytes=8)

    async def receive():
        pytest.fail("Oversized declared request must not be read")

    messages = []

    async def send(message):
        messages.append(message)

    await guard({"type": "http", "method": "POST", "path": "/api/convert", "headers": [(b"content-length", b"9")]}, receive, send)
    assert messages[0]["status"] == 413
    assert not called and guard.active == 0


async def test_chunked_oversize_rejected():
    async def downstream(scope, receive, send):
        pytest.fail("Oversized body must not reach multipart parser")

    guard = ConversionGuard(downstream, max_body_bytes=8)

    async def chunks():
        yield b"12345"
        yield b"67890"

    async with AsyncClient(transport=ASGITransport(app=guard), base_url="http://test") as client:
        response = await client.post("/api/convert", content=chunks())
    assert response.status_code == 413
    assert guard.active == 0


async def test_busy_request_rejected_and_slot_released():
    from starlette.responses import JSONResponse

    entered = asyncio.Event()
    release = asyncio.Event()

    async def downstream(scope, receive, send):
        message = await receive()
        assert message["body"] == b"ok"
        entered.set()
        await release.wait()
        await JSONResponse({"ok": True})(scope, receive, send)

    guard = ConversionGuard(downstream, max_body_bytes=8)
    async with AsyncClient(transport=ASGITransport(app=guard), base_url="http://test") as client:
        task = asyncio.create_task(client.post("/api/convert", content=b"ok"))
        try:
            await asyncio.wait_for(entered.wait(), timeout=2)
            busy = await client.post("/api/convert", content=b"ok")
            assert busy.status_code == 503
            assert busy.headers["retry-after"] == "10"
        finally:
            release.set()
        assert (await task).status_code == 200
        assert (await client.post("/api/convert", content=b"ok")).status_code == 200
    assert guard.active == 0


async def test_upload_deadline_releases_slot():
    async def downstream(scope, receive, send):
        pytest.fail("Timed-out upload must not reach parser")

    guard = ConversionGuard(downstream, max_body_bytes=8, upload_timeout=0.01)

    async def slow():
        await asyncio.sleep(1)
        yield b"ok"

    async with AsyncClient(transport=ASGITransport(app=guard), base_url="http://test") as client:
        result = await client.post("/api/convert", content=slow())
    assert result.status_code == 408
    assert guard.active == 0


async def test_health_not_subject_to_conversion_admission():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        assert (await client.get("/api/health")).status_code == 200


async def test_pdf_response_cleanup_when_send_fails(tmp_path):
    from app.main import TemporaryPDFResponse

    job = tmp_path / "job"
    job.mkdir()
    path = job / "result.pdf"
    path.write_bytes(b"%PDF-test")
    response = TemporaryPDFResponse(path, job_dir=job, media_type="application/pdf")

    async def receive():
        return {"type": "http.disconnect"}

    async def send(message):
        raise OSError("Simulated client disconnect")

    with pytest.raises(OSError):
        await response({"type": "http", "method": "GET", "headers": []}, receive, send)
    assert not job.exists()
