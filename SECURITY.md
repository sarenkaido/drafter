# Security

## Reporting a problem

Please **don't open a public issue** for security problems.

Report them privately through GitHub instead: open the **Security** tab of this repository and click **Report a vulnerability**. You'll get a reply as soon as possible.

## How Daftar handles your data

- Everything stays on your own device. The app makes no network requests and has no accounts, analytics or ads.
- Data is stored in a JSON file in the app's data folder (see [docs/BUILD.md](docs/BUILD.md#where-user-data-lives)), with one automatic backup per day.
- Backup and CSV files you import are validated before use: unknown fields are dropped, and text is never inserted into the page as HTML.
- The app window runs under a strict Content Security Policy (no remote scripts, no inline scripts).

## Releases

Release files are built by GitHub Actions from the public source in this repository (`.github/workflows/release.yml`). Third-party actions are pinned to exact commits, and only the final publish step has permission to write to releases.

The Android APK is signed with a release key that is stored only as an encrypted GitHub secret, never in the repository.
