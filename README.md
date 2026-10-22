# Space Wars: Neon Drift

A browser and desktop arcade game with a ten-sector campaign. Clear each sector, select an upgrade, and defeat the Sector 10 boss to win. Replay starts at Sector 1; your best score stays saved on that device.

## Develop

Use Node.js 22 and npm.

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open http://127.0.0.1:8080. Movement: arrow keys or pointer. Dash: Space. Nova: X. Pause: P or Escape.

```sh
npm run check       # JavaScript syntax validation
npm test            # Gameplay regression tests
npm run build       # Web assets in dist/, with commit metadata
npm run test:smoke  # Smoke test the built website
npm run desktop     # Run Electron after building
npm run package:desktop # Build an installer for the current OS
```

Desktop packaging uses Electron and electron-builder. The renderer has Node integration disabled, context isolation enabled, and sandboxing enabled. Desktop assets are bundled for offline play. GitHub Actions builds Windows x64 EXE, Linux x64 DEB, and Apple Silicon ARM64 DMG. Intel Macs are not covered by this initial matrix.

## Pull requests and deployment

`Test and deploy game` runs syntax checks, gameplay tests, and a built-site smoke test. PRs do not deploy. Successful main builds deploy the tested web artifact to GitHub Pages, then check the live page, assets, start/pause controls, and deployed commit ID. Download failure traces/screenshots from workflow artifacts. Enable GitHub Pages with **GitHub Actions** as its source, and make **Game checks** a required branch-protection check in repository Settings.

Dependabot proposes npm and Actions updates weekly; review and merge them after checks pass. No automatic dependency merging is configured. At implementation time, `npm audit` reported eight moderate advisories in the electron-builder development dependency chain (sprintf-js via logging/proxy dependencies), with no high or critical advisories. Track upstream fixes; the suggested automatic fix downgrades the packager and has not been applied.

## Desktop releases

1. Run **Desktop release** manually without simulated failure to rehearse all three platform builds. Download installers from the run's artifacts. Manual runs never publish a release.
2. Update `package.json` version and synchronize the lockfile with `npm install --package-lock-only`. Merge that change through a PR.
3. Tag that main commit with the matching version, for example `git tag v1.1.0`, then `git push origin v1.1.0`.
4. Actions validates the version, runs tests, builds installers, and launches each packaged application. Only after all three succeed does it upload all installers and `SHA256SUMS.txt` into a draft and publish it.

The launch smoke test checks the unpacked application that goes into each installer; it does not automate the operating system's installer UI. These initial installers are unsigned and macOS builds are not notarized. Signing credentials and notarization are a separate setup step before broad distribution. Checksums detect altered downloads; they do not replace code signing.

Verify downloads from a release directory:

```sh
# Linux
sha256sum -c SHA256SUMS.txt
# macOS
shasum -a 256 -c SHA256SUMS.txt
# Windows PowerShell: compare with the corresponding manifest line
Get-FileHash .\Neon-Drift-1.1.0-win-x64.exe -Algorithm SHA256
```

Download all listed assets for a full manifest check, or compare just the line for your installer. If uploading a release fails, its draft remains unpublished. Remove that incomplete draft before rerunning the workflow; existing releases are never silently overwritten.

## Demonstrate failure safely

Run **Desktop release** manually and select `simulate_failure`. Tests run, then the validation gate fails intentionally. Packaging and publication must show **skipped**. Capture that run for your project presentation, followed by a successful manual rehearsal. This does not break main or replace a public release.

## Roll back the website

Run **Roll back Pages** from the main branch, supplying a full 40-character known-good commit SHA from main. Choose a commit that includes these build scripts. The workflow validates ancestry, builds and tests that commit, deploys it, then verifies the live commit ID. This changes the deployed site, not Git history. A failed live smoke check marks the workflow failed but does not automatically roll back.

Pause merges/deployments during rollback so a queued main deployment does not replace it. Fix or revert the bad change in main before the next deployment. To demonstrate recovery, deploy two harmless visible revisions and roll back to the first. Desktop rollback means downloading a previous release; it does not downgrade already installed apps automatically.

## Contributions and assets

Keep changes focused, run the checks above, and describe the behavior and validation in your PR. Gameplay is currently in `index.html`, browser tests in `tests/`, packaging helpers in `scripts/`, and workflows in `.github/workflows/`.

The package currently declares ISC licensing. Asset ownership and redistribution permissions still need to be documented before presenting the whole game as freely redistributable; the existing Star Wars-themed artwork is not assigned a new license by this change.
