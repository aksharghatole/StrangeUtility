from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from tempfile import TemporaryDirectory
import json
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[3]

def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as p, TemporaryDirectory() as temp:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width":390,"height":844}, accept_downloads=True)
            page.route("**/*", lambda route: route.continue_() if route.request.url.startswith(origin + "/") else route.abort())
            page.goto(origin + "/apps/tabledelta/")
            page.locator("#sample").click()
            page.locator("#compare").click()
            expect(page.locator("#metrics .metric b")).to_have_text(["1","1","1","1","1"])
            expect(page.locator("#conflicts")).to_contain_text("Duplicate key")
            page.locator("#filter").select_option("changed")
            expect(page.locator("#entries .entry")).to_have_count(1)
            page.locator("#entries summary").click()
            expect(page.locator("#entries")).to_contain_text('"80" → "85"')
            with page.expect_download() as d:
                page.locator("#json").click()
            dest = Path(temp) / "report.json"
            d.value.save_as(str(dest))
            report = json.loads(dest.read_text())
            assert report["counts"]["excludedKeys"] == 1
            assert report["changes"][0]["status"] in ("changed","added","removed")
            with page.expect_download() as d:
                page.locator("#csv").click()
            dest = Path(temp) / "report.csv"
            d.value.save_as(str(dest))
            assert '"conflict"' in dest.read_text(encoding="utf-8-sig")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            page.locator("#clear").click()
            expect(page.locator("#results")).to_be_hidden()
            expect(page.locator("#before-text")).to_have_value("")
            page.locator("#before-file").set_input_files({"name":"a.csv","mimeType":"text/csv","buffer":b'id,name\n01,A'})
            page.locator("#after-file").set_input_files({"name":"b.csv","mimeType":"text/csv","buffer":b'id,name\n01,B'})
            expect(page.locator("#before-text")).to_have_value("id,name\n01,A")
            expect(page.locator("#after-text")).to_have_value("id,name\n01,B")
            page.locator("#inspect").click()
            page.locator("#compare").click()
            expect(page.locator("#metrics .metric b")).to_have_text(["0","0","1","0","0"])
            # Verify a controlled offline reload and fresh local comparison.
            page.wait_for_function("navigator.serviceWorker.controller !== null")
            expect(page.locator("#offline-status")).to_contain_text("Offline shell ready")
            assert page.evaluate("""async () => {
                const reg = await navigator.serviceWorker.ready;
                const cache = await caches.open('strangeutility-tabledelta-shell-v2');
                const keys = await cache.keys();
                return reg.scope.endsWith('/apps/tabledelta/') && keys.length === 5 &&
                    keys.every(k => k.url.startsWith(reg.scope));
            }""")
            page.context.set_offline(True)
            page.reload()
            expect(page.locator("#before-text")).to_have_value("")
            page.locator("#sample").click()
            page.locator("#compare").click()
            expect(page.locator("#metrics .metric b")).to_have_text(["1","1","1","1","1"])
            with page.expect_download() as d:
                page.locator("#json").click()
            dest = Path(temp) / "offline.json"
            d.value.save_as(str(dest))
            assert json.loads(dest.read_text())["counts"]["changed"] == 1
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)

if __name__ == "__main__":
    main()
