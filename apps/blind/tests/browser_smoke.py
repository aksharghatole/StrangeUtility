"""Browser-only checks with synthetic colours and Chromium's fake camera."""
import csv
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread

from PIL import Image
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[3]
KEY = "strangeutility.blind.palette.v1"


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f"http://127.0.0.1:{server.server_port}"
    url = origin + "/apps/blind/"
    try:
        with TemporaryDirectory() as directory, sync_playwright() as p:
            folder = Path(directory)
            photo = folder / "red.png"
            Image.new("RGB", (80, 80), (255, 0, 0)).save(photo)
            browser = p.chromium.launch(args=["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"])
            context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, accept_downloads=True)
            context.grant_permissions(["camera"], origin=origin)
            page = context.new_page()
            page.goto(origin + "/")
            page.evaluate("""() => localStorage.setItem('colour-lens', JSON.stringify([
                {hex:'#112233',name:'Legacy sample',date:'2026-01-01'},
                {hex:'invalid',name:'Invalid'}
            ]))""")
            page.goto(url)
            expect(page.locator("#saved")).to_contain_text("Legacy sample")
            assert page.evaluate("(key) => JSON.parse(localStorage.getItem(key)).length", KEY) == 1
            assert page.evaluate("JSON.parse(localStorage.getItem('colour-lens')).length") == 2
            page.locator("#manualHex").fill("#0F0")
            page.locator("#lookup").click()
            expect(page.locator("#hex")).to_have_text("#00FF00", ignore_case=True)
            page.locator("#save").click()
            expect(page.locator("#count")).to_have_text("(2)")
            page.locator("#save").click()
            expect(page.locator("#count")).to_have_text("(2)")
            page.locator("#savedSearch").fill("Legacy")
            expect(page.locator("#saved .saved-item")).to_have_count(1)
            page.locator("#savedSearch").fill("")
            with page.expect_download() as downloaded:
                page.locator("#export").click()
            output = folder / "palette.csv"
            downloaded.value.save_as(str(output))
            with output.open(encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))
            assert {row["HEX"].upper() for row in rows} == {"#00FF00", "#112233"}
            page.locator("#photo").set_input_files(str(photo))
            expect(page.locator("#status")).to_contain_text("Photo loaded")
            expect(page.locator("#hex")).to_have_text("#FF0000", ignore_case=True)
            page.locator("#extract").click()
            expect(page.locator("#palette .chip")).to_have_count(1)
            page.locator("#assistMode").select_option("deutan")
            page.locator("#assistFilter").click()
            expect(page.locator("#assistFilter")).to_have_attribute("aria-pressed", "true")
            expect(page.locator("#hex")).to_have_text("#FF0000", ignore_case=True)
            page.locator("#setGarmentA").click()
            page.locator("#manualHex").fill("#0000FF")
            page.locator("#lookup").click()
            page.locator("#setGarmentB").click()
            expect(page.locator("#speakOutfit")).to_be_enabled()
            expect(page.locator("#outfitResult")).to_contain_text("Brightness contrast")
            page.locator("#camera").click()
            expect(page.locator("#camera")).to_have_text("Stop camera", timeout=20000)
            expect(page.locator("#freeze")).to_be_enabled()
            page.locator("#freeze").click()
            expect(page.locator("#status")).to_contain_text("Camera frame frozen")
            expect(page.locator("#camera")).to_have_text("Open camera")
            page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=30000)
            assert page.evaluate("navigator.serviceWorker.controller.scriptURL").endswith("/apps/blind/sw.js")
            assert page.evaluate("caches.keys().then(keys => keys.includes('strangeutility-blind-v1'))")
            context.set_offline(True)
            page.reload(wait_until="load")
            expect(page.locator("#count")).to_have_text("(2)")
            page.locator("#manualHex").fill("#ABCDEF")
            page.locator("#lookup").click()
            expect(page.locator("#hex")).to_have_text("#ABCDEF", ignore_case=True)
            context.set_offline(False)
            page.goto(origin + "/")
            assert page.evaluate("navigator.serviceWorker.controller === null")
            context.close()
            browser.close()
            print("Blind synthetic photo, palette migration, CSV, assistance, clothing, simulated camera and offline checks passed.")
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


if __name__ == "__main__":
    main()
