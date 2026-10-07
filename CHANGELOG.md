# Changelog
## 20261007.0.2.9 — 2026-10-07
- Use saved album IDs to restore downloaded status during the normal album-list scan.
- Remove folder authorization, ZIP inspection and per-album photo counting from the normal scan.
- Add a separate full verification action for comparing JSON records, local ZIP files and website photo counts.
- Reuse the remembered directory handle when confirming permission instead of reopening the folder picker.
- Change the folder button label according to whether the folder must be selected, authorized or changed.

## 20261007.0.2.8 — 2026-10-07
- Convert space-separated Gregorian years and months in album names to ROC calendar format.
- Rename the folder setting section and add a concise authorization notice.
- Align the folder selection and rescan buttons with matching dimensions.
- Remove unnecessary full-path limitation text from the downloader page.

## 20261007.0.2.7 — 2026-10-07
- Hide the original pagination controls immediately.
- Redirect later-page album and photo URLs to page 1 while preserving filters and album parameters.
- Ensure continuous browsing always loads the complete sequence from page 1.
- Keep pagination hidden when automatic loading fails.

## 20261007.0.2.6 — 2026-10-07
- Convert Gregorian dates in generated filenames to ROC calendar dates.
- Keep existing ROC calendar dates and normalize their month and day digits.
- Match manually renamed ZIP files such as `1150317世界水資源日.zip` with `115.0317世界水資源日`.
- Convert compact Gregorian dates created by earlier versions when comparing ZIP filenames.

## 20261007.0.2.5 — 2026-10-07
- Remove the manual full path display field.
- Show the selected folder name and its current Chrome permission status.
- Add the public extension version to the top-right corner of the downloader page.
- Remove obsolete path label data from the folder index and extension settings.

## 20261007.0.2.4 — 2026-10-07
- Normalize complete Gregorian dates to `yyyymmdd` with zero-padded months and days.
- Convert complete ROC calendar dates to Gregorian `yyyymmdd`.
- Keep year-month values as `yyyymm` instead of inventing a missing day.
- Apply the same date normalization when matching ZIP files created by previous versions.

## 20261007.0.2.3 — 2026-10-07
- Remove `~` from generated filenames.
- Remove periods between date digits and replace `、` with `-`.
- Replace other invalid filename separators with readable hyphens or remove them.
- Match older ZIP filenames using punctuation-insensitive normalized album names.
- Compare the number of files in each ZIP with the current website album photo count.
- Mark mismatched ZIP files as incomplete and keep those albums selected for download.

## 20261007.0.2.2 — 2026-10-07
- Determine downloaded albums from ZIP files that actually exist in the selected folder.
- Add `topschool-album-downloads.json` to preserve album IDs and download details across extension updates or reinstalls.
- Recover older downloads by matching unique sanitized album ZIP filenames.
- Add a user-defined full path label for display because Chrome does not expose absolute folder paths.
- Add a button to rescan the selected folder after files are moved or deleted.

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
