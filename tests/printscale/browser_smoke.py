from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from tempfile import TemporaryDirectory
import io
import os

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright, expect
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]


def fixture():
    image = Image.new("RGB", (1200, 900), "#f5f1e8")
    ImageDraw.Draw(image).rectangle((100, 100, 1100, 800), fill="#315b50")
    data = io.BytesIO()
    image.save(data, format="PNG")
    return data.getvalue()


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"))
            page = browser.new_page(viewport={"width": 390, "height": 844})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{server.server_port}/apps/printscale/")
            page.locator("#file").set_input_files({
                "name": "fixture.png",
                "mimeType": "image/png",
                "buffer": fixture(),
            })
            expect(page.locator("#preview")).to_be_visible()
            expect(page.locator("#diagram .tile")).to_have_count(6)
            expect(page.locator("#status")).to_contain_text("3 across × 2 down")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")

            page.locator("#print").click()
            expect(page.locator("#pages .page")).to_have_count(6)
            page_sizes = page.locator("#pages .page").evaluate_all(
                "pages => pages.map(page => [page.style.width, page.style.height])"
            )
            assert page_sizes == [["210mm", "297mm"]] * 6, page_sizes
            pdf_bytes = page.pdf(print_background=True)
            with TemporaryDirectory() as output:
                pdf = Path(output) / "printscale.pdf"
                pdf.write_bytes(pdf_bytes)
                document = PdfReader(str(pdf))
                assert len(document.pages) == 6, f"Expected 6 printed sheets, got {len(document.pages)}"
                for sheet in document.pages:
                    assert abs(float(sheet.mediabox.width) - 595.28) < 1
                    assert abs(float(sheet.mediabox.height) - 841.89) < 1
            assert not errors, errors
            browser.close()
            print("PASS: local image preview, six-sheet layout, mobile width and A4 PDF pages")
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


if __name__ == "__main__":
    main()
