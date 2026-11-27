from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
from tempfile import TemporaryDirectory
import io
import json
import os
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[3]

def fixture(text):
    img = Image.new("RGB", (1200, 700), "white")
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 72)
    draw = ImageDraw.Draw(img)
    draw.text((100, 180), text, font=font, fill="black")
    data = io.BytesIO()
    img.save(data, "PNG")
    return data.getvalue()

def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f"http://127.0.0.1:{server.server_port}"
    url = origin + "/apps/pocketscan/"
    try:
        with sync_playwright() as p, TemporaryDirectory() as directory:
            browser = p.chromium.launch(executable_path=os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"))
            context = browser.new_context(viewport={"width":390,"height":844}, accept_downloads=True)
            page = context.new_page()
            page.on("pageerror", lambda error: print("BROWSER PAGE ERROR:", error))
            page.on("console", lambda message: print("BROWSER CONSOLE ERROR:", message.text) if message.type == "error" else None)
            context.route("**/*", lambda route: route.continue_() if route.request.url.startswith(origin+"/") or route.request.url.startswith("blob:") else route.abort())
            page.goto(url)
            page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=120000)
            expect(page.locator("#offline")).to_contain_text("Offline resources cached")
            context.set_offline(True)
            page.reload(wait_until="load")
            page.locator("#files").set_input_files([
                {"name":"one.png","mimeType":"image/png","buffer":fixture("POCKETSCAN TEST")},
                {"name":"two.png","mimeType":"image/png","buffer":fixture("SECOND PAGE")},
            ])
            expect(page.locator("#pages .page")).to_have_count(2)
            page.locator("#mode").select_option("gray")
            page.locator("#left").fill("5")
            page.locator("#apply").click()
            assert page.locator("#preview").evaluate("el => el.width") == 1140
            page.locator("#ocr").click()
            page.wait_for_function("document.querySelector('#text').value.trim() || document.querySelector('#status').textContent.startsWith('OCR failed:')", timeout=180000)
            recognized = page.locator("#text").input_value()
            assert recognized == "POCKETSCAN TEST", f"OCR did not return the fixture text: {page.locator('#status').inner_text()} (got {recognized!r})"
            page.locator("#text").fill("Reviewed text")
            with page.expect_download() as download:
                page.locator("#txt").click()
            text_path=Path(directory)/"text.txt"
            download.value.save_as(str(text_path))
            assert "Reviewed text" in text_path.read_text()
            page.get_by_role("button",name="Page 2",exact=True).click()
            page.locator("#rotate").click()
            assert page.locator("#preview").evaluate("el => el.width") == 700
            page.get_by_role("button",name="Move page 2 earlier").click()
            with page.expect_download(timeout=60000) as download:
                page.locator("#pdf").click()
            pdf_path=Path(directory)/"scan.pdf"
            download.value.save_as(str(pdf_path))
            doc=PdfReader(str(pdf_path))
            assert len(doc.pages)==2
            assert float(doc.pages[0].mediabox.width)<float(doc.pages[0].mediabox.height)
            assert float(doc.pages[1].mediabox.width)>float(doc.pages[1].mediabox.height)
            assert all(len(p.images)==1 for p in doc.pages)
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+1")
            cache_keys=page.evaluate("caches.keys()")
            names=[k for k in cache_keys if k.startswith("strangeutility-pocketscan-")]
            assert len(names)==1
            cached=page.evaluate("async name => (await (await caches.open(name)).keys()).map(r=>r.url)",names[0])
            assert all(u.startswith(url) and not u.startswith("blob:") for u in cached)
            assert any(u.endswith("eng.traineddata.gz") for u in cached)
            page.on("dialog",lambda d:d.accept())
            page.locator("#clear").click()
            expect(page.locator("#editor")).to_be_hidden()
            assert page.locator("#pages .page").count()==0
            browser.close()
            print("PASS: cached offline English OCR, manual crop/rotation, page ordering, editable text, real two-page PDF and mobile layout")
    finally:
        server.shutdown();server.server_close();thread.join(timeout=5)

if __name__=="__main__":
    main()
