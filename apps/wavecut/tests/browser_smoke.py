from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
from tempfile import TemporaryDirectory
import io
import wave
import struct
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[3]

def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as p, TemporaryDirectory() as folder:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width":390,"height":844}, accept_downloads=True)
            page.route("**/*", lambda r: r.continue_() if r.request.url.startswith(origin+"/") or r.request.url.startswith("blob:") else r.abort())
            page.goto(origin+"/apps/wavecut/")
            page.locator("#sample").click()
            expect(page.locator("#editor")).to_be_visible()
            page.locator("#silence").click()
            assert float(page.locator("#start").input_value()) > .4
            canvas=page.locator("#wave").bounding_box()
            assert canvas is not None
            y=canvas["y"]+canvas["height"]/2
            page.mouse.move(canvas["x"]+canvas["width"]*.25,y)
            page.mouse.down()
            page.mouse.move(canvas["x"]+canvas["width"]*.75,y,steps=4)
            page.mouse.up()
            assert abs(float(page.locator("#start").input_value())-1)<.01
            assert abs(float(page.locator("#end").input_value())-3)<.01
            expect(page.locator("#wave-hint")).to_contain_text("Drag across the waveform")
            page.locator("#fade-in").fill("0.1")
            page.locator("#fade-out").fill("0.1")
            page.locator("#normalize").check()
            page.locator("#render").click()
            expect(page.locator("#output")).to_be_visible()
            with page.expect_download() as d:
                page.locator("#save").click()
            dest = Path(folder)/"edited.wav"
            d.value.save_as(str(dest))
            with wave.open(str(dest),"rb") as w:
                assert w.getframerate()==16000 and w.getnchannels()==1
                assert 31000 < w.getnframes() < 33000
                data=struct.unpack("<"+"h"*w.getnframes(),w.readframes(w.getnframes()))
                assert data[0]==data[-1]==0
                assert abs(max(map(abs,data))-29204)<5
            page.locator("#start").fill("0")
            expect(page.locator("#output")).to_be_hidden()
            page.locator("#clear").click()
            expect(page.locator("#editor")).to_be_hidden()
            payload=io.BytesIO()
            with wave.open(payload,"wb") as w:
                w.setnchannels(2);w.setsampwidth(2);w.setframerate(8000)
                w.writeframes(b"\x00\x01\x00\xff"*8000)
            page.locator("#file").set_input_files({"name":"stereo.wav","mimeType":"audio/wav","buffer":payload.getvalue()})
            expect(page.locator("#info")).to_have_text("8000 Hz · Stereo")
            page.locator("#render").click()
            expect(page.locator("#output")).to_be_visible()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
            page.locator("#file").set_input_files({"name":"bad.wav","mimeType":"audio/wav","buffer":b"invalid"})
            expect(page.locator("#status")).to_contain_text("Expected a WAV")
            expect(page.locator("#output")).to_be_hidden()
            browser.close()
            print("PASS: silence trim, waveform range drag, fades, normalization, mono/stereo WAV and mobile layout")
    finally:
        server.shutdown();server.server_close();thread.join(timeout=5)

if __name__=="__main__":
    main()
