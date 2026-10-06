# Changelog
## 20261006.0.2.0 — 2026-10-06
- Replace filename characters invalid on Windows or macOS with similar full-width characters.
- Handle Windows reserved filenames and sanitize custom nested download paths.
- Add a remembered download subdirectory under Chrome's default Downloads folder.
- Record albums only after their ZIP download completes; show and skip recorded albums by default.
- Add a control to clear extension download records without deleting ZIP files.

## 0.1.0 — 2026-09-30
- Add continuous browsing for album and photo pages.
- Add native large-photo dialog for appended photos.
- Add complete album selection and one ZIP per album.
- Add sequential downloads, cancellation, retries and a 512 MiB per-album guard.
- Limit access to the school and observed image CDN.
