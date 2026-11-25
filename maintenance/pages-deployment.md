# Pages deployment repair

2026-11-25: PR #3 merged after CI. Main run 45611686826 uploaded unique artifact github-pages-1 (ID 15019933844) successfully, but deploy could not find metadata immediately. Later API GET /actions/runs/45611686826/artifacts returned exactly one unexpired matching artifact. Add bounded metadata polling via gh API, explicit actions:read, then deploy only when exactly one matching artifact is visible. No change to Pages settings or hosting. Main deployment remains unverified.

2026-11-25: run 45619022310 failed with the same no-artifact error after verification. Separate package and deploy jobs, output artifact name from the package job (not the retry attempt in the deploy job). PRs now verify static packaging without deployment. Failed deploy-only retries should reuse the existing artifact while retained; if expired, rerun all jobs. This is an attempted mitigation, not verified resolution.
