import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from functools import partial

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[3]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{server.server_port}/apps/receiptsplit/"

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
        page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
        page.goto(url, wait_until="networkidle")

        assert page.locator(".receipt-item").count() == 3
        page.get_by_role("button", name="Calculate split").click()
        assert page.locator("#summary").inner_text() == "Items 38.50 − discount 0.00 + extras 4.50 = 43.00"
        # 450 cents are weighted by the 1,350/1,350/1,150-cent item subtotals.
        assert [value.inner_text() for value in page.locator(".person .amount").all()] == ["15.08", "15.08", "12.84"]

        page.locator("#payer").select_option("1")
        page.get_by_role("button", name="Assign full payment").click()
        assert page.locator("#transfers").inner_text() == "Asha pays Ben 15.08; Chloe pays Ben 12.84"
        with page.expect_download() as download:
            page.get_by_role("button", name="Download text summary").click()
        summary = download.value.path().read_text(encoding="utf-8")
        assert "Total: 43.00" in summary
        assert "Asha pays Ben 15.08" in summary
        page.get_by_role("button", name="Everyone paid their share").click()
        assert page.locator("#transfers").inner_text() == "Already settled."
        page.locator("#discount").fill("3.50")
        page.get_by_role("button", name="Calculate split").click()
        assert page.locator("#summary").inner_text() == "Items 38.50 − discount 3.50 + extras 4.50 = 39.50"
        page.locator("#discount").fill("0")
        page.get_by_role("button", name="Add item").click()
        assert page.get_by_role("button", name="Export JSON receipt").is_disabled()
        row = page.locator(".receipt-item").last
        row.get_by_label("Item name").fill("Dessert")
        row.get_by_label("Amount").fill("1.00")
        row.get_by_label("Asha").check()
        row.get_by_label("Chloe").check()
        page.get_by_role("button", name="Calculate split").click()
        assert page.locator("#summary").inner_text() == "Items 39.50 − discount 0.00 + extras 4.50 = 44.00"
        assert page.get_by_role("button", name="Export JSON receipt").is_enabled()

        row.get_by_role("button", name="Remove item 4").click()
        assert page.get_by_role("button", name="Export JSON receipt").is_disabled()
        assert page.locator("#summary").inner_text() == "Calculate to see the breakdown."
        page.get_by_role("button", name="Calculate split").click()
        assert page.locator("#summary").inner_text() == "Items 38.50 − discount 0.00 + extras 4.50 = 43.00"

        first_row = page.locator(".receipt-item").first
        first_row.get_by_role("button", name="Select everyone").click()
        assert first_row.locator("input[type=checkbox]:checked").count() == 3
        assert page.locator(".receipt-item").nth(1).locator("input[type=checkbox]:checked").count() == 1
        assert page.get_by_role("button", name="Export JSON receipt").is_disabled()
        page.get_by_role("button", name="Calculate split").click()
        assert page.get_by_role("button", name="Export JSON receipt").is_enabled()
        first_row.get_by_role("button", name="Clear selection").click()
        assert first_row.locator("input[type=checkbox]:checked").count() == 0
        assert page.get_by_role("button", name="Export JSON receipt").is_disabled()
        page.get_by_role("button", name="Calculate split").click()
        assert "invalid item" in page.get_by_role("alert").inner_text().lower()
        assert page.get_by_role("button", name="Export JSON receipt").is_disabled()

        first_row.get_by_role("button", name="Duplicate item").click()
        copy = page.locator(".receipt-item").last
        assert copy.get_by_label("Item name").input_value() == "Pizza"
        assert copy.get_by_label("Amount").input_value() == "21.00"
        assert copy.locator("input[type=checkbox]:checked").count() == 0
        copy.get_by_label("Ben").check()
        assert first_row.locator("input[type=checkbox]:checked").count() == 0
        assert page.locator("#download").is_disabled()
        copy.get_by_role("button", name="Remove item 5").click()

        # Adding a row must not silently reassign an intentionally empty item.
        page.get_by_role("button", name="Add item").click()
        assert not first_row.get_by_label("Asha").is_checked()
        assert not first_row.get_by_label("Ben").is_checked()
        page.locator("#names").fill("Asha\nBen\nChloe\nDev")
        assert not first_row.get_by_label("Asha").is_checked()
        page.get_by_role("button", name="Clear", exact=True).click()
        assert page.locator(".receipt-item").count() == 1
        assert page.locator("#names").input_value() == ""
        assert page.locator("#error").inner_text() == ""

        page.set_viewport_size({"width": 320, "height": 740})
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        browser.close()
finally:
    server.shutdown()
