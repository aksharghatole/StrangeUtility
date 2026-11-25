# Pages deployment repair

2026-11-25: main run 45585224346 verified successfully but deployment failed; retry found two artifacts named github-pages. Use a unique matching artifact name for upload and deployment on each run attempt. This change is identical to the Pages portion of Blind PR #2 and is isolated so the portal can deploy without waiting for Android. Verify main deployment after merge. No live deployment yet.
