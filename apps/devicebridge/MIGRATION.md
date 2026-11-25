# DeviceBridge — imported preview

Source: https://github.com/aksharghatole/DeviceBridge/tree/62d3f05f9d880f9acf03c66ee2bc627108a9e9ca
Original source snapshot copied, including vendored QR code source and its license file and notices. The application has no top-level LICENSE; do not infer one. Vendored QRCode header names Kazuhiko Arase (MIT); vendor/LICENSE contains Apache 2.0 text. Confirm complete upstream notices and licensing before public redistribution or retirement of original. No source history imported. No personal files or runtime state copied.

## Run
From apps/devicebridge, run npm test, then npm start. The backend needs its own origin because the frontend uses root-relative signaling endpoints and service worker. Do not place the backend UI directly on the shared GitHub Pages origin. Preserve original Render service and APK/browser links. The included render.yaml is a reference, not an approved new deployment; never apply it without verifying quota and avoiding service duplication.

## Verification
Node HTTP tests cover room lifecycle, signaling authorization, QR and ZIP. Browser smoke covers simulated peers, not physical phones or all NAT combinations. No new deployment yet; no actual two-device test during import. Existing preference values are local to the existing origin; retain existing origin where possible, otherwise document re-entry. Never transfer room credentials across origins. Review SSE query-token exposure in host logs, resource limits, origin trust and WebRTC limitations before release. Original repo remains rollback route. Portal link and central registry deferred until PR checks and deployment verification.

## Retirement
Do not archive or disable the original until validated parity, data handling, deployment and explicit user approval.
