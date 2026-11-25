"""Prepare exact, integrity-pinned browser assets without installing npm code."""
import base64
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import shutil
import tarfile
import tempfile
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
LOCK = json.loads((ROOT / "vendor-lock.json").read_text())
MAX_ARCHIVE = 32 * 1024 * 1024
MAX_FILE = 16 * 1024 * 1024
EXACT = {
    "pdfjs-dist": {
        "build/pdf.min.mjs": "pdf.min.mjs",
        "build/pdf.worker.min.mjs": "pdf.worker.min.mjs",
        "LICENSE": "pdfjs-LICENSE",
    },
    "pdf-lib": {
        "dist/pdf-lib.esm.min.js": "pdf-lib.esm.min.mjs",
        "LICENSE.md": "pdf-lib-LICENSE.md",
        "LICENSE": "pdf-lib-LICENSE",
    },
}

def destination(package, name):
    if name in EXACT[package]:
        return EXACT[package][name]
    if package == "pdfjs-dist":
        parts = PurePosixPath(name).parts
        if len(parts) == 2 and parts[0] in ("cmaps", "standard_fonts"):
            return name
    return None

def prepare():
    with tempfile.TemporaryDirectory(dir=ROOT) as temp:
        stage = Path(temp) / "vendor"
        stage.mkdir()
        for package in LOCK["packages"]:
            name = package["name"]
            with urlopen(package["url"], timeout=60) as response:
                archive = response.read(MAX_ARCHIVE + 1)
            if len(archive) > MAX_ARCHIVE:
                raise ValueError("Archive exceeds size limit")
            integrity = "sha512-" + base64.b64encode(hashlib.sha512(archive).digest()).decode()
            if integrity != package["integrity"]:
                raise ValueError(f"Integrity mismatch: {name}")
            with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as tar:
                for member in tar:
                    if not member.name.startswith("package/"):
                        continue
                    rel = member.name.removeprefix("package/")
                    target = destination(name, rel)
                    if target is None or not member.isfile():
                        continue
                    if member.size > MAX_FILE or ".." in PurePosixPath(target).parts:
                        raise ValueError("Unexpected archive member")
                    output = stage / target
                    output.parent.mkdir(parents=True, exist_ok=True)
                    with tar.extractfile(member) as source, output.open("wb") as dest:
                        shutil.copyfileobj(source, dest)
        required = ["pdf.min.mjs", "pdf.worker.min.mjs", "pdf-lib.esm.min.mjs", "pdfjs-LICENSE"]
        for filename in required:
            if not (stage / filename).is_file():
                raise ValueError(f"Missing asset: {filename}")
        if not list(stage.glob("pdf-lib-LICENSE*")):
            raise ValueError("Missing pdf-lib license")
        if not list((stage / "cmaps").glob("*.bcmap")) or not list((stage / "standard_fonts").glob("*")):
            raise ValueError("Missing PDF.js font resources")
        assets = ["./", "./index.html", "./offline-assets.js"]
        digest = hashlib.sha256()
        for filename in ("index.html", "sw.js", "vendor-lock.json"):
            digest.update((ROOT / filename).read_bytes())
        for file in sorted(stage.rglob("*")):
            if file.is_file():
                relative = "vendor/" + file.relative_to(stage).as_posix()
                assets.append("./" + relative)
                digest.update(relative.encode())
                digest.update(file.read_bytes())
        vendor = ROOT / "vendor"
        if vendor.exists():
            shutil.rmtree(vendor)
        shutil.move(str(stage), str(vendor))
        (ROOT / "offline-assets.js").write_text(
            "self.PAPERWORK_ASSETS = " + json.dumps({"version": digest.hexdigest()[:20], "files": assets}) + ";\n",
            encoding="utf-8",
        )
        print(f"Prepared {len(assets)} integrity-verified local assets.")

if __name__ == "__main__":
    prepare()
