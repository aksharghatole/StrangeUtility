# DeviceBridge — imported preview

Source: https://github.com/aksharghatole/DeviceBridge/tree/62d3f05f9d880f9acf03c66ee2bc627108a9e9ca
Original source snapshot copied, including vendored QR code source and its license file and notices. The application has no top-level LICENSE; do not infer one. Vendored QRCode header names Kazuhiko Arase (MIT); vendor/LICENSE contains Apache 2.0 text. Confirm complete upstream notices and licensing before public redistribution or retirement of original. No source history imported. No personal files or runtime state copied.

## Run
From apps/devicebridge, run npm test, then npm start. The backend needs its own origin because the frontend uses root-relative signaling endpoints and service worker. Do not place the backend UI directly on the shared GitHub Pages origin. Preserve original Render service and APK/browser links. The included render.yaml is a reference, not an approved new deployment; never apply it without verifying quota and avoiding service duplication.

## Verification
Node HTTP tests cover room lifecycle, signaling authorization, QR and ZIP. Browser smoke covers simulated peers, not physical phones or all NAT combinations. No new deployment yet; no actual two-device test during import. Existing preference values are local to the existing origin; retain existing origin where possible, otherwise document re-entry. Never transfer room credentials across origins. Review SSE query-token exposure in host logs, resource limits, origin trust and WebRTC limitations before release. Original repo remains rollback route. Portal link and central registry deferred until PR checks and deployment verification.

## Retirement
Do not archive or disable the original until validated parity, data handling, deployment and explicit user approval.

## Signaling admission follow-up
Add bounded per-process rate-limit storage, separate join/QR/event/signal request budgets, pre-read JSON size check, cross-origin browser fetch-metadata rejection, fixed-length constant-time token comparison, heartbeat backpressure and HTTP header/request timeouts. CI pending. Rate limits are socket-IP based and may be shared by reverse-proxy users; do not trust forwarded IP headers without a configured proxy boundary. SSE query tokens remain a logging risk; replace in a later compatible transport migration. No claim of end-to-end identity authentication or physical-network parity. Original Render service unchanged.

## Header-authenticated event stream
Replace EventSource query-token transport with a bounded fetch/SSE reader using the Authorization header, cancellation and bounded exponential reconnection. Reject legacy token URLs even when the token is valid. Update shell cache version. Old open/cached clients must reload after the updated worker activates; do not switch the current service until coordinated client/server deployment is verified. Authorization headers must still be redacted in proxy logs. Tests pending; no physical-device claim.
