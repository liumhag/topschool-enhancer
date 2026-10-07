# Changelog
## 20261007.0.2.1 — 2026-10-07
- Replace the Chrome Downloads subdirectory setting with a system folder picker.
- Allow ZIP files to be written to a selected folder on another drive, such as `D:\TopSchool`.
- Remember the selected folder handle and request write permission again when required.
- Preserve existing ZIP files by adding a numeric suffix to duplicate filenames.
- Set the Chrome internal version to `0.2.1` and the displayed version to `20261007.0.2.1`.

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
