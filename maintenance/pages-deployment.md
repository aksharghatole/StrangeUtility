# Pages deployment repair

2026-11-25: PR #3 merged after CI. Main run 45611686826 uploaded unique artifact github-pages-1 (ID 15019933844) successfully, but deploy could not find metadata immediately. Later API GET /actions/runs/45611686826/artifacts returned exactly one unexpired matching artifact. Add bounded metadata polling via gh API, explicit actions:read, then deploy only when exactly one matching artifact is visible. No change to Pages settings or hosting. Main deployment remains unverified.
