# Backend cutover — readiness checklist
Reviewed 2026-11-25. This is a plan, not a deployment. No new service, billing change, repo relink, or old-service shutdown is authorized by this document.

| Service | Current verified configuration | Candidate monorepo configuration |
|---|---|---|
| DeviceBridge | Free, Singapore, Node, original DeviceBridge/main; build npm test; start npm start | root apps/devicebridge; same commands; health /health |
| Word-to-PDF | Free, Singapore, Docker, original word-to-pdf/main; context .; Dockerfile backend/Dockerfile | root apps/word-to-pdf; Docker context .; Dockerfile backend/Dockerfile; health /api/health |

Existing public URLs: https://devicebridge-4ncq.onrender.com/ and https://word-to-pdf-b4dr.onrender.com/app/. Existing service configuration checked via Render; no live endpoint verification or memory measurements in this run.

## Preconditions
1. Confirm free workspace quotas, repo connection permissions and whether service repo can be changed without losing the hostname. Do not create a duplicate paid service or assume a free preview slot is available. Capture existing settings, last successful deployment ID and commit, health, memory/CPU observations, and rollback procedure without copying secrets into Git.
2. Word-to-PDF: real conversion and non-root container checks passed. Review supported library versions, untrusted-document isolation, proxy limits, memory/CPU under bounded synthetic conversions, and cold starts before public cutover.
3. DeviceBridge: HTTP/browser integration and header-authenticated event stream tests passed. Verify on physical devices across Wi-Fi and mobile networks; inspect proxy header redaction, shared-IP admission behavior and SSE lifetime. Existing cached clients require coordinated reload; room state is ephemeral, so schedule maintenance after active sessions finish.
4. Obtain separate approval if a change would interrupt, relink or replace existing services. Keep original source repositories and working services available. Daily Discovery remains local-only; no public hosting until persistent storage and authentication reviewed.

## Acceptance and rollback
Verify the exact candidate commit and CI; test health, a synthetic small Word conversion (validate PDF magic and output content) and two-device transfer of a non-sensitive known file (compare bytes), reconnect, and leave. Confirm same origin and free plan remain intact. Only update portal deployment metadata after actual verification. Roll back using captured working deployment/configuration if health or functional checks fail; old service must not be retired first. No real user documents or credentials in test logs.
