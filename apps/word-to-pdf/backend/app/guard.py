"""Bound conversion request size and in-flight work before multipart parsing."""
import asyncio
import tempfile

from starlette.responses import JSONResponse


class ConversionGuard:
    """Per-process admission control for a single-worker conversion service."""

    def __init__(self, app, *, max_body_bytes, max_in_flight=1, upload_timeout=30):
        self.app = app
        self.max_body_bytes = max_body_bytes
        self.max_in_flight = max_in_flight
        self.upload_timeout = upload_timeout
        self.active = 0

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST" or scope["path"].rstrip("/") != "/api/convert":
            await self.app(scope, receive, send)
            return

        async def reject(status, detail, headers=None):
            await JSONResponse({"detail": detail}, status_code=status, headers=headers)(scope, receive, send)

        lengths = [value for name, value in scope.get("headers", []) if name.lower() == b"content-length"]
        if lengths:
            if len(lengths) != 1 or not lengths[0].isdigit():
                await reject(400, "Invalid Content-Length.")
                return
            if int(lengths[0]) > self.max_body_bytes:
                await reject(413, "Upload exceeds request size limit.")
                return

        if self.active >= self.max_in_flight:
            await reject(503, "Converter is busy. Please try again shortly.", {"Retry-After": "10"})
            return

        # No await between admission and increment; one event loop per worker.
        self.active += 1
        try:
            with tempfile.SpooledTemporaryFile(max_size=1024 * 1024, mode="w+b") as body:
                size = 0
                try:
                    async with asyncio.timeout(self.upload_timeout):
                        while True:
                            message = await receive()
                            if message["type"] == "http.disconnect":
                                return
                            chunk = message.get("body", b"")
                            size += len(chunk)
                            if size > self.max_body_bytes:
                                await reject(413, "Upload exceeds request size limit.")
                                return
                            body.write(chunk)
                            if not message.get("more_body", False):
                                break
                except TimeoutError:
                    await reject(408, "Upload timed out.")
                    return

                body.seek(0)
                remaining = size
                done = False

                async def replay():
                    nonlocal remaining, done
                    if done:
                        return await receive()
                    chunk = body.read(min(1024 * 1024, remaining))
                    remaining -= len(chunk)
                    done = remaining == 0
                    return {"type": "http.request", "body": chunk, "more_body": not done}

                await self.app(scope, replay, send)
        finally:
            self.active -= 1
