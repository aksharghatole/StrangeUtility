"""Fetch exact package archives, verify SHA-512, copy only allowed assets."""
import base64
import hashlib
import io
import json
import shutil
import tarfile
import tempfile
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
MAX = 64 * 1024 * 1024

def main():
    lock = json.loads((ROOT / "vendor-lock.json").read_text())
    with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
        stage = Path(tmp) / "vendor"
        stage.mkdir()
        for package in lock["packages"]:
            with urlopen(package["url"], timeout=90) as response:
                archive = response.read(MAX + 1)
            actual = "sha512-" + base64.b64encode(hashlib.sha512(archive).digest()).decode()
            if len(archive) > MAX or actual != package["integrity"]:
                raise ValueError("Archive integrity mismatch: " + package["name"])
            with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as tar:
                for source, target in package["files"].items():
                    try:
                        member = tar.getmember("package/" + source)
                    except KeyError:
                        if source.startswith("LICENSE"):
                            continue
                        raise
                    if not member.isfile() or member.size > MAX or Path(target).name != target:
                        raise ValueError("Unexpected archive member")
                    with tar.extractfile(member) as stream, (stage / target).open("wb") as output:
                        shutil.copyfileobj(stream, output)
        for pattern in ("tesseract-LICENSE*", "pdf-lib-LICENSE*", "core-LICENSE", "eng-README.md"):
            if not list(stage.glob(pattern)):
                raise ValueError("Missing license or provenance notice: " + pattern)
        vendor = ROOT / "vendor"
        if vendor.exists():
            shutil.rmtree(vendor)
        shutil.move(str(stage), str(vendor))
        assets = ["./", "./index.html", "./style.css", "./core.mjs", "./app.mjs", "./manifest.webmanifest", "./icon.svg", "./offline-assets.js"]
        digest = hashlib.sha256()
        for filename in ["index.html", "style.css", "core.mjs", "app.mjs", "sw.js", "manifest.webmanifest", "icon.svg", "vendor-lock.json"]:
            digest.update((ROOT / filename).read_bytes())
        for item in sorted(vendor.iterdir()):
            assets.append("./vendor/" + item.name)
            digest.update(item.name.encode())
            digest.update(item.read_bytes())
        (ROOT / "offline-assets.js").write_text("self.POCKETSCAN_ASSETS = " + json.dumps({"version":digest.hexdigest()[:20],"files":assets}) + ";\n")
        print("Prepared integrity-verified scanner assets.")

if __name__ == "__main__":
    main()
