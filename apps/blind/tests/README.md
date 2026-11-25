# Browser integration tests

Run from repo root with Python 3.12: `python -m pip install playwright==1.51.0 pillow==11.2.1`, `python -m playwright install chromium`, `python apps/blind/tests/browser_smoke.py`. Uses generated PNG, synthetic legacy palette and Chromium fake camera, not real personal photos or hardware. Verifies offline reload and app-scoped service worker. Android build is separate; real Android camera, permissions, speech and storage must still be tested on a device. No external API or paid service.
