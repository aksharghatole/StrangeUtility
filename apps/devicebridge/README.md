# DeviceBridge v2.0

A browser-based cross-device sharing prototype. Pair devices using an invite link, QR code or a random 10-character room code. No account, database or application file storage. Node.js serves the interface and exchanges only room membership and WebRTC signaling. WebRTC carries text and file content over an encrypted data channel. Rooms support six devices.

## Run on your computer

1. Install Node.js 18 or later (https://nodejs.org/).
2. Extract this archive, open a terminal in the `devicebridge` folder, and run `npm start`. There are no packages to install.
3. Open http://localhost:3000 on the computer and create a room.
4. To connect a phone on the same Wi-Fi, find your computer's local IPv4 address (`ipconfig` on Windows, `ip addr` on Linux). Open `http://YOUR_LOCAL_IP:3000` on both devices, then create a room using that address so the QR invite is reachable from the phone. Allow inbound TCP 3000 on your private network if your firewall prompts you. Do not expose the local server directly to the public internet.
5. Join on the second device using the QR code, invite link or room code. Wait until it is shown as connected. Select a file or enter text and send it. The recipient must accept each file and then click Download.

Some mobile browsers restrict WebRTC or clipboard access on insecure HTTP. If local HTTP does not work, deploy over HTTPS. Both browser tabs must remain open. Do not use the localhost invite on a second physical device.

## Deploy online (Render)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Faksharghatole%2FDeviceBridge)

1. Open the deployment link and sign in to Render. Connect your own GitHub account if prompted.
2. Review the Blueprint (`render.yaml`), choose the **Free** web service, and approve deployment. No database is needed.
3. Open the HTTPS URL shown in your Render dashboard on both devices. Create a room on one and join on the other.
4. Test text, then a small file, and verify that the recipient receives the exact file. The health endpoint is `/health`.

The free service may sleep after 15 minutes without inbound traffic. It can take time to wake, and rooms are lost on restart or deployment. This is hobby hosting, not an availability guarantee. Auto-deploy is configured for the main branch. Never add long-lived TURN secrets to this public repository.

## Public HTTPS deployment

This is a single Node HTTP service, not a static site. Upload the contents to a repository and deploy it to a Node-compatible host using `npm start`. The server listens on `PORT` (default 3000). Configure TLS at the hosting provider or reverse proxy. SSE responses must not be buffered and the host must permit long-lived HTTP connections. Run one server instance because rooms are in memory. GitHub Pages by itself cannot run the signaling server. A Dockerfile is included.

Default ICE configuration uses Google's public STUN endpoint. Some networks require a TURN relay; set `ICE_SERVERS` to a JSON array of RTCIceServer objects (e.g. `[ {"urls":"stun:stun.l.google.com:19302"}, {"urls":"turn:YOUR_HOST:3478","username":"...","credential":"..."} ]`). Use short-lived TURN credentials in production; configured credentials are visible to clients. TURN can cost money and relays encrypted traffic. No hosted URL or TURN service is included.

## What's new in v2.0

- Mobile-friendly workspace overview and focused device, send, notes, screen, watch and activity views. The recipient selector remains accessible in every view. Incoming requests are surfaced through an activity alert; active file requests are never hidden by search.
- Queue size/count, clear selection, searchable finished activity, larger tap targets, keyboard focus and narrow-screen layout improvements.
- Completed in-memory received files are capped at 512 MiB in aggregate per open room tab (excluding previews, queued files, ZIP generation and other browser overhead). Download and clear finished activity or use direct-to-disk receiving when supported.
- Clear message drafts when leaving a room, release retained file references, fix screen picker cancellation, and prevent replacing local watch media after a viewer is ready.
- Server request byte and JSON shape validation, malformed signaling rejection, bounded signaling rate and slow event-stream protection. This is a targeted hardening pass, not an independent security audit.

## What's new in v1.9

- One-to-one synchronized playback of independently selected, identical local audio/video files. SHA-256 confirms file equality; only invitations and playback state travel over the existing data channel. No media upload, recording or streaming.
- Explicit invitation acceptance, host-controlled play/pause/seek/rate, periodic best-effort drift correction and a manual playback-unlock button for browser autoplay restrictions.
- Supported media extensions depend on browser codecs. A 64 MiB local media limit bounds hashing memory. Both devices need their own copy, and exact frame synchronization is not guaranteed. Sessions end on disconnect.

## What's new in v1.8

- One-to-one live screen sharing with an explicit browser capture picker and separate recipient approval. Video only; no microphone, recording or remote control.
- Screen media uses a separate WebRTC peer connection; negotiation travels through the existing data channel and respects strict pairing. Stop controls and capture-end handling close the media session. Disconnecting stops sharing instead of restarting it automatically.
- Screen capture support varies by platform, particularly mobile browsers; receiving is possible without capture support. Native picker and physical-device performance still need manual testing.
- Browser tests substitute a generated canvas stream for the native capture picker, exercising recipient consent, live video delivery and stop controls.

## What's new in v1.7

- Device comparison codes derived from both negotiated WebRTC SHA-256 certificate fingerprints. Compare codes independently in person or through a trusted channel; never confirm based solely on a message in the room.
- Optional strict pairing mode, selected before joining or creating a room. Enable it on both devices to prevent file, text and note data until each side confirms its code. Unverified peers are excluded from the recipient picker in strict mode.
- Verification applies only to the current peer connection; reconnection requires comparison again. No permanent trusted-device registry or identity claim is made. Legacy/unverified sharing remains available when strict mode is off.
- Verification requires a secure context with Web Crypto. It assumes the app code itself is trusted.

## What's new in v1.6

- Interrupted in-memory transfers can resume from the receiver's retained byte offset after the same peer reconnects. The sender explicitly requests recovery, and the receiver must approve it. Both pages must remain open in the same room.
- A single receiver-side partial file is retained in memory for five minutes (up to the existing 256 MiB limit). It can be discarded explicitly; leaving the room or refreshing loses it. A new incoming transfer is rejected while a checkpoint is retained.
- Sender recalculates the original prefix CRC32 before continuing and the receiver validates the entire file at completion. Interrupted direct-to-disk transfers still restart from scratch.
- Recovery is not persistent across browser or server restarts. It does not store any file on the signaling server.

## What's new in v1.5

- Compatible secure-context browsers with the File System Access save picker can choose **Save to disk** on an incoming file. Writes are incremental with a 1 MiB application-level acknowledgment window; CRC32 and final disk close must succeed before the sender receives a delivery acknowledgment.
- Direct-to-disk transfer allows files up to 1 GiB. The regular in-memory path remains capped at 256 MiB. Direct disk saving is optional and browser-dependent; mobile browsers that lack the save picker keep the previous limit.
- Disk-saved files are not retained in the activity ZIP or media preview collection. Choose the file destination explicitly. Failed and cancelled writes are aborted where supported.
- The browser test uses a controlled save-picker substitute backed by origin-private storage. Real device save dialogs and 1 GiB stress performance need manual validation.

## What's new in v1.4

- Pause and resume an active send while the peer channel remains open (up to ten minutes). Older clients that do not negotiate pause support will not see the pause control.
- Incremental CRC32 on negotiated transfers validates the received bytes without an extra full-file buffer; CRC32 is an accidental-corruption check, not a cryptographic authenticity guarantee.
- Failed sends can be returned to the selection queue for explicit retry. Interrupted transfers restart from byte zero; there is no partial-file resumption.
- Receive inactivity timeout and bounded sender backpressure wait. The per-file size limit remains 256 MiB until disk-backed receiving has been validated.

## What's new in v1.3

- Room-only shared notepad using peer data channels. Edits sync automatically to all connected members, latest revision wins (not collaborative character-level merging). Notes are not stored; leaving clears the local note, other connected members retain their copy.
- Explicit clipboard paste into the message composer, followed by a separate send action. No clipboard monitoring.
- Optional generic incoming-activity notifications while the page is open; availability depends on browser and permissions. No background transfer or push service.
- Connection diagnostics without displaying IP addresses, plus retry controls and bounded automatic peer reset after failures. Interrupted files must be sent again; expired rooms must be rejoined or recreated.
- Quick navigation between pairing, sending, notes and activity.

## What's new in v1.2

- Installable web app on compatible browsers, with an offline interface after the first successful load. On iOS use the browser's Add to Home Screen action. Room creation and signaling still require an internet connection.
- Download completed received files in a single locally generated ZIP. No uploads or server-side archive processing.
- Choose a folder and pack its files (including relative paths) into a ZIP before sending. Folder picker support varies; empty folders are not included. ZIP uses stored entries rather than compression, with a 240 MiB input limit and 2,000-file cap to protect mobile memory.
- Service worker caches the public app shell only; never caches room codes, API requests or transferred files. After a release, close all app tabs and reopen to activate the new cached shell.

## What's new in v1.1

- Live transfer progress with estimated average speed and remaining time. Sender reports bytes queued, not final delivery; receiver acknowledgment still confirms delivery.
- Explicit previews for common raster image, video and audio extensions (browser codec support applies). No automatic previews or active document rendering.
- Optional local history of completed file names, sizes, timestamps and direction. Off by default; clearing or disabling it removes saved metadata. File contents and text are not persisted.
- Camera/photo picker and a saved light/dark theme. Native camera availability depends on device and browser.

## Features and boundaries

- Up to six devices, QR/invite/code pairing, recipient selection, device status.
- Multiple files queued sequentially; consent, decline, progress, cancellation and receipt acknowledgment. Maximum 256 MiB per in-memory file or 1 GiB with supported direct disk saving, and one active incoming file per browser. Receiving uses browser memory; large files may fail on low-memory devices. Clear completed activity to free retained blobs.
- Text/link sharing and explicit copy-to-clipboard (no background clipboard reading).
- Ephemeral activity; clearing or leaving discards unsaved files. No unattended transfer resume, offline messaging, device authentication beyond possession of the invitation, or background transfers. Rooms disappear on restart or once empty; disconnected members expire after two minutes.
- Use only with trusted peers and a trusted signaling host. WebRTC encrypts transport, but the current prototype does not independently verify peer identity or protect against a malicious signaling service. Do not publish invitations. For production, add independently verified pairing, session hardening, anti-abuse controls, monitoring, and browser/device testing. Avoid logging query strings (event-stream session tokens appear in URLs). The service exposes no file upload endpoint.

## Verification

Run `npm test` for HTTP room lifecycle, QR generation and signaling authorization. JavaScript syntax checked with `node --check`. The included optional Playwright smoke test covers browser pairing, text, file download bytes, decline and disconnect. It could not run in the build environment because local Chromium navigation was blocked by administrator policy; actual device transfers are not yet verified. To run it yourself, install Python Playwright, run `python -m playwright install chromium`, then `python browser-smoke.py`.

## Third-party notice

Vendored QRCode JavaScript by Kazuhiko Arase (MIT, copyright 2009), adapted by qrcode-terminal. See vendor/LICENSE and source headers. All other app files are original for this project.
