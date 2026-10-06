# TopSchool Album Enhancer
Read README.md and CHANGELOG.md before modifying code.
Chrome Manifest V3; local-only processing; no telemetry, external JS, server, credentials or photo uploads.
Limit permissions to winnerpreschool.topschool.tw, the verified image CDN, and downloads.
Provide continuous album/photo browsing, complete album scans independent of visible DOM, selection and one ZIP per album named after its title.
Pagination keys are case-insensitive; preserve category filters. Use actual photo-gallery hrefs, never guess originals from thumbnails.
Do not commit children's photos, HTML snapshots, tokens or downloaded ZIPs.
Keep docs and version synchronized. Run node --check on JavaScript and tests/verify.py after changes.
Live installation and large downloads require user-side verification; report untested behavior honestly.
