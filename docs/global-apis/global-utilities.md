# Other Global Utilities

These extra global APIs provide essential information about asset directories, storage locations, app features, and system specifications.

## Storage & asset directories

| Global | Type | Description |
|--------|------|-------------|
| `ASSETS_DIRECTORY` | `string` | The directory where all the app assets are stored |
| `DATA_STORAGE` | `string` | The directory where all the app data files are stored |
| `CACHE_STORAGE` | `string` | The directory where all the cache files are stored |
| `PLUGIN_DIR` | `string` | The directory where all the plugins are stored |
| `KEYBINDING_FILE` | `string` | The file where all the keybindings are stored |

```javascript
console.log(ASSETS_DIRECTORY); // /android_asset/www
```

## Features

| Global | Type | Description |
|--------|------|-------------|
| `DOES_SUPPORT_THEME` | `boolean` | Whether the app supports themes |
| `ANDROID_SDK_INT` | `number` | The Android SDK version |

::: warning
The `IS_FREE_VERSION` global documented by older guides **does not exist** in the current Acode source and referencing it throws a `ReferenceError`. Use `acode.require("config").HAS_PRO` instead (`true` = Pro, `false` = free). See [Config](./config.md).
:::

## `window.app` and `window.root`

- `window.app` - the `<body>` element of the app (`document.body`). Use it to append UI.
- `window.root` - the `#root` element that Acode's UI is mounted into.

```javascript
const page = document.createElement("div");
window.app.appendChild(page);
```

## `window.appInstallSource`

Read-only string describing where the app was installed from (e.g. `"play"`, `"fdroid"`, `"web"`, …). Determined at startup from the OS installer.

```javascript
if (window.appInstallSource === "play") {
  // Play Store build
}
```

## `window.log(level, message)`

Writes a log entry that is buffered and flushed to `DATA_STORAGE/Acode.log` (10 MB cap, rotated from the top). `level` is one of `"error"`, `"warn"`, `"info"`, or `"debug"`; the minimum recorded level is `"info"` by default.

`message` may be a string or an `Error` (in which case the stack trace is included).

```javascript
window.log("error", "Something went wrong");
window.log("warn", "Low battery");
window.log("info", "Plugin initialized");
```

## `BuildInfo`

The Cordova `BuildInfo` plugin object, clobbered to `window.BuildInfo`. Read-only app metadata populated at startup:

| Property | Type | Description |
|----------|------|-------------|
| `packageName` | `string` | App package id (e.g. `com.foxdebug.acode` or `com.foxdebug.acodefree`) |
| `basePackageName` | `string` | Base package name |
| `displayName` / `name` | `string` | App display name |
| `version` | `string` | Version name (e.g. `1.11.2`) |
| `versionCode` | `number` | Version code (integer) |
| `debug` | `boolean` | Whether the build is a debug build |
| `buildType` | `string` | Gradle build type |
| `flavor` | `string` | Gradle flavor |
| `installDate` | `string` | Formatted install date |

```javascript
const isNewer = BuildInfo.versionCode >= 1008;
const isFree = /free$/.test(BuildInfo.packageName);
```

::: info
The Pro flag is `acode.require("config").HAS_PRO`, not a `BuildInfo` field. On the free build the package name ends in `free`.
:::

## `system`

The native `system` plugin (`cordova-plugin-system`), clobbered to `window.system`. Provides low-level Android utilities used by Acode and plugins: file operations, storage management, runtime permissions, app/device info, intents, shortcuts, and text comparison.

```javascript
system.fileAction(fileUri, filename, "VIEW", "text/plain");
```

See [System](../advanced-apis/system.md) for the full API.

## `strings`

The app's localized string table, clobbered to `window.strings` from `src/lib/lang.js`. It is a `{ key: value }` dictionary of the current language's translations.

```javascript
window.strings.error; // localized "Error" text
```

::: tip
Prefer the [helpers](../utilities/helpers.md) module (`acode.require("helpers")`) for the most common cross-cutting utilities.
:::
