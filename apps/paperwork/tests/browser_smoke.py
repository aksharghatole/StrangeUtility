"""Real PDF engine browser test. No mocked PDF libraries or private documents."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread

from playwright.sync_api import sync_playwright, expect
from pypdf import PdfReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[3]


def fixture(path, labels):
    pdf = canvas.Canvas(str(path), pagesize=(420, 560))
    for label in labels:
        pdf.setFont("Helvetica", 20)
        pdf.drawString(40, 480, label)
        pdf.showPage()
    pdf.save()


def ready(page, url):
    page.goto(url)
    expect(page.locator("#status")).to_contain_text("Ready", timeout=90000)


def open_pdf(page, path):
    page.locator("#file").set_input_files(str(path))
    expect(page.locator("#pdfcanvas")).to_have_css("visibility", "visible", timeout=60000)
    expect(page.locator("#export")).to_be_enabled()


def wait_render(page, position):
    expect(page.locator("#position")).to_have_text(position)
    expect(page.locator("#pdfcanvas")).to_have_css("visibility", "visible", timeout=60000)


def main():
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f"http://127.0.0.1:{server.server_port}/apps/paperwork/"
    try:
        with TemporaryDirectory() as directory, sync_playwright() as p:
            folder = Path(directory)
            original = folder / "sample.pdf"
            extra = folder / "extra.pdf"
            fixture(original, ["First page", "Second page"])
            fixture(extra, ["Third page"])
            browser = p.chromium.launch()
            desktop = browser.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True)
            page = desktop.new_page()
            outgoing = []
            page.on("request", lambda req: outgoing.append((req.method, req.url)))
            ready(page, url)
            open_pdf(page, original)
            wait_render(page, "1 / 2")
            page.locator("#fitSelect").select_option("actual")
            expect(page.locator("#zoom")).to_have_value("100")
            page.locator("#plus").click()
            expect(page.locator("#zoom")).to_have_value("120")
            page.locator("#fitSelect").select_option("page")
            page.locator('[data-tool="text"]').click()
            page.locator("#marks").click(position={"x": 100, "y": 150})
            expect(page.locator("#textdialog")).to_be_visible()
            page.locator("#textvalue").fill("Test overlay")
            page.locator("#confirmText").click()
            expect(page.locator("#marks g")).to_have_count(1)
            page.locator("#undo").click()
            expect(page.locator("#marks g")).to_have_count(0)
            page.locator("#redo").click()
            expect(page.locator("#marks g")).to_have_count(1)
            page.locator('[data-tool="select"]').click()
            page.locator("#next").click()
            wait_render(page, "2 / 2")
            page.locator("#up").click()
            wait_render(page, "1 / 2")
            page.locator("#rotate").click()
            page.locator("#duplicate").click()
            wait_render(page, "2 / 3")
            page.locator("#remove").click()
            expect(page.locator("#count")).to_have_text("2")
            with page.expect_file_chooser() as chooser:
                page.locator("#add").click()
            chooser.value.set_files(str(extra))
            wait_render(page, "3 / 3")
            with page.expect_download(timeout=60000) as download:
                page.locator("#export").click()
            exported = folder / "export.pdf"
            download.value.save_as(str(exported))
            result = PdfReader(str(exported))
            assert len(result.pages) == 3
            assert "Second page" in result.pages[0].extract_text()
            assert result.pages[0].rotation == 90
            assert "First page" in result.pages[1].extract_text()
            assert len(result.pages[1].images) >= 1, "Overlay should be rasterized into exported page"
            assert "Third page" in result.pages[2].extract_text()
            expect(page.locator("#export")).to_be_enabled()
            with page.expect_download(timeout=60000) as extracted:
                page.locator("#extract").click()
            single = folder / "single.pdf"
            extracted.value.save_as(str(single))
            assert len(PdfReader(str(single)).pages) == 1
            assert not any(method not in ("GET", "HEAD") for method, _ in outgoing), outgoing
            desktop.close()
            mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            phone = mobile.new_page()
            ready(phone, url)
            open_pdf(phone, original)
            wait_render(phone, "1 / 2")
            phone.locator("#next").click()
            wait_render(phone, "2 / 2")
            mobile.close()
            browser.close()
            print("Real PDF import, zoom, annotation, undo/redo, reorder, rotate, merge, export, extract and mobile navigation passed.")
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


if __name__ == "__main__":
    main()
