# MarkText Harmony

This directory is the HarmonyOS shell for the MarkText hybrid MVP. It does not
try to package the Electron desktop app. ArkTS owns the app shell, storage,
settings, recent files, and export flow; the Muya editor core runs as static
WebView assets under `entry/src/main/resources/rawfile/editor`.

## Current MVP Surface

- `Index.ets`: home page, new document entry, recent document list.
- `EditorPage.ets`: ArkWeb editor container, save, export, theme toggle.
- `SettingsPage.ets`: persisted editor theme and font size.
- `bridge/EditorBridge.ets`: the only ArkTS bridge entrypoint to
  `window.MarkTextEditor`.
- `services/FileService.ets`: sandbox Markdown read/write.
- `services/RecentFileService.ets`: recent document persistence.
- `services/SettingsService.ets`: editor settings persistence.
- `services/ExportService.ets`: sandbox HTML export.

## Refresh Web Editor Assets

Run from the repository root:

```bash
pnpm prepare:harmony-editor
```

This command builds `packages/harmony-editor` and copies:

```text
dist/harmony-editor/index.html
dist/harmony-editor/editor.bundle.js
dist/harmony-editor/editor.css
```

into:

```text
harmony/entry/src/main/resources/rawfile/editor/
```

For device runtime, the copied `index.html` inlines the generated CSS and JS.
ArkWeb blocks `resource://rawfile/...` CSS and script subresources as cross
origin requests, so the rawfile runtime loads a single self-contained HTML entry.

## Local Validation

Run from the repository root:

```bash
pnpm verify:harmony
```

This runs the full local MVP gate:

```text
pnpm prepare:harmony-editor
pnpm validate:harmony
pnpm smoke:harmony-editor
pnpm build:harmony
```

The gate builds and copies the Web editor assets, checks the Harmony MVP
structure, smoke-tests the Web bridge, then compiles ArkTS and packages an
unsigned HAP.

The Web editor bridge can also be smoke-tested locally:

```bash
pnpm smoke:harmony-editor
```

This serves `dist/harmony-editor`, injects a mock `window.MarkTextHarmony`
host, and verifies `editorReady`, `contentChanged`, `saveRequested`,
`setMarkdown`, `getMarkdown`, `exportHtml`, `setTheme`, `setFontSize`, and
`focusEditor`.

## DevEco Verification Checklist

Open the `harmony/` directory in DevEco Studio, then verify:

1. Project sync completes.
2. `entry` builds without ArkTS errors.
3. App launches to `Index`.
4. `New Document` opens `EditorPage`.
5. The Web editor loads `resource://rawfile/editor/index.html`.
6. Editing Markdown marks the document dirty.
7. `Save` writes Markdown into the app sandbox and updates recent files.
8. Returning to `Index` shows the saved document in recent files.
9. Opening a recent file restores its Markdown.
10. Theme and font size saved in `SettingsPage` apply in `EditorPage`.
11. `Export` writes an HTML file into the app sandbox.

Before running, the command-line device check can confirm that `hdc` sees an
emulator or device:

```bash
pnpm check:harmony-device
```

This command only checks connectivity. It does not install or launch the app.
The local DevEco emulator may report a TCP target as `Connected` rather than
`Ready`; the script treats it as usable only after an `hdc shell` probe succeeds.
If an emulator does not become runnable, collect the local emulator state with:

```bash
pnpm diagnose:harmony-emulator
```

This prints the Emulator version, configured emulator instances, `hdc` target
state, and recent critical emulator log lines.

After `pnpm verify:harmony` passes and a target is connected, the command-line
install/launch helper is:

```bash
pnpm run:harmony-device
```

If multiple targets are connected, select one explicitly:

```bash
HARMONY_HDC_TARGET=<target-id> pnpm run:harmony-device
```

The helper installs `entry-default-unsigned.hap` with `hdc install -r`, then
launches `com.gaoding000.qingmo/EntryAbility` with `aa start`. DevEco Studio is
still the preferred place to observe the UI and verify ArkWeb loading, editing,
save, recent files, settings, and export behavior.

## Command-Line Build

On this Windows machine, the Harmony command-line tools are installed at:

```text
D:\Program\command-line-tools
```

The user PATH should include:

```text
D:\Program\command-line-tools\bin
D:\Program\command-line-tools\sdk\default\openharmony\toolchains
```

From the repository root, the wrapped build command is:

```bash
pnpm build:harmony
```

It runs this lower-level command from `harmony/`:

```bash
hvigorw assembleHap --no-daemon --stacktrace
```

It produces an unsigned MVP HAP at:

```text
harmony/entry/build/default/outputs/default/entry-default-unsigned.hap
```

Signing is intentionally not configured yet, so Hvigor reports that signing is
skipped.

Local runtime has been verified on the DevEco `Pura 90` emulator after
downloading the HarmonyOS 6.1.1(24) phone image. The emulator appears as:

```text
127.0.0.1:10178 (TCP, Connected)
```

Verified runtime flow:

```text
1. unsigned HAP installs with hdc install -r.
2. EntryAbility launches.
3. Home page renders.
4. New Document opens ArkWeb.
5. Muya renders the default Markdown and reports Editor ready.
6. Save writes the Markdown into the app sandbox.
7. Returning home shows the saved file in Recent Documents.
```

Current app sandbox files are written directly under `context.filesDir`, which
resolved the emulator's `No such file or directory` failures for nested MVP
subdirectories.

## Non-Goals For This MVP

- No Electron packaging or desktop code migration.
- No login.
- No cloud sync.
- No plugin system.
- No PDF export.
- No external file permission flow beyond the app sandbox.
