"""Check the static release staging directory without publishing it."""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

root = Path(sys.argv[1]).resolve()
registry = json.loads((root / "registry.json").read_text())
for filename in ("index.html", "portal/portal.js", "packages/ui/portal.css"):
    assert (root / filename).is_file(), filename
for app in registry:
    if app.get("path"):
        directory = (root / app["path"]).resolve()
        assert directory.is_relative_to(root)
        assert (directory / "index.html").is_file(), app["id"]

paper = root / "apps/paperwork"
data = (paper / "offline-assets.js").read_text().strip()
assert data.startswith("self.PAPERWORK_ASSETS = ") and data.endswith(";")
manifest = json.loads(data.removeprefix("self.PAPERWORK_ASSETS = ").removesuffix(";"))
assert re.fullmatch(r"[a-f0-9]{20}", manifest["version"])
for entry in manifest["files"]:
    assert not urlsplit(entry).scheme and entry.startswith("./")
    target = (paper / entry).resolve()
    assert target.is_relative_to(paper)
    assert target.is_file() or (entry == "./" and (target / "index.html").is_file()), entry
for filename in ("sw.js", "vendor/pdf.min.mjs", "vendor/pdf.worker.min.mjs", "vendor/pdf-lib.esm.min.mjs"):
    assert (paper / filename).is_file(), filename
for filename in ("index.html", "sw.js", "manifest.webmanifest", "icon.svg"):
    assert (root / "apps/blind" / filename).is_file(), filename
for filename in ("index.html", "style.css", "app.mjs", "core.mjs", "sw.js"):
    assert (root / "apps/tabledelta" / filename).is_file(), filename
assert not any(p.suffix in {".py", ".sqlite3", ".db", ".apk"} or p.name == ".env" for p in root.rglob("*") if p.is_file())
print("Static staging validated.")
