"""Document-to-PDF conversion via LibreOffice headless."""

import asyncio
import shutil
import subprocess
import os
import signal
from contextlib import suppress
import uuid
from pathlib import Path

from .config import OUTPUT_DIR


class ConversionError(Exception):
    """Raised when LibreOffice fails to produce a PDF."""


def _find_soffice() -> str | None:
    """Locate the LibreOffice binary on the system PATH."""
    for name in ("soffice", "libreoffice"):
        path = shutil.which(name)
        if path:
            return path
    return None


async def convert_to_pdf(
    input_path: Path,
    output_dir: Path = OUTPUT_DIR,
) -> Path:
    """Convert a document to PDF using LibreOffice headless.

    Args:
        input_path: Path to the source document.
        output_dir: Directory where the PDF should be written.

    Returns:
        Path to the generated PDF.

    Raises:
        ConversionError: If LibreOffice is missing or conversion fails.
    """
    soffice = _find_soffice()
    if soffice is None:
        raise ConversionError(
            "LibreOffice not installed. Install 'soffice' or run via Docker."
        )

    if not input_path.exists():
        raise ConversionError(f"Input file not found: {input_path}")

    job_id = uuid.uuid4().hex
    job_dir = output_dir / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    profile = job_dir / "profile"

    cmd = [
        soffice,
        f"-env:UserInstallation={profile.resolve().as_uri()}",
        "--headless",
        "--norestore",
        "--convert-to",
        "pdf",
        "--outdir",
        str(job_dir),
        str(input_path),
    ]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        **({"start_new_session": True} if os.name == "posix" else {}),
    )
    try:
        _, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)
    except (TimeoutError, asyncio.CancelledError) as exc:
        with suppress(ProcessLookupError):
            if os.name == "posix":
                os.killpg(proc.pid, signal.SIGKILL)
            else:
                proc.kill()
        await proc.wait()
        shutil.rmtree(job_dir, ignore_errors=True)
        if isinstance(exc, asyncio.CancelledError):
            raise
        raise ConversionError("Conversion timed out.") from exc

    if proc.returncode != 0:
        raise ConversionError(
            f"LibreOffice exited {proc.returncode}: "
            f"{stderr.decode(errors='ignore').strip()}"
        )

    pdfs = list(job_dir.glob("*.pdf"))
    if not pdfs:
        raise ConversionError("Conversion produced no PDF output.")

    return pdfs[0]
