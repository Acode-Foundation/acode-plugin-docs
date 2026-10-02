# System

The `system` module wraps Acode's native Android bridge (`cordova-plugin-system`). It is clobbered to `window.system` and provides low-level device, file, storage, permission, intent, and shortcut utilities that Acode itself uses.

```js
const system = window.system;
```

::: warning `acode.require("system")` returns `undefined`
`system` is a **Cordova clobber**, not an Acode module. `src/lib/acode.js` never calls `this.define("system", …)` — the only modules it registers are listed in its constructor, and `system` is not among them (`require()` is a plain lookup in the private `#modules` map, so an unregistered name yields `undefined`).

| Access | Works? |
| --- | --- |
| `acode.require("system")` | ❌ returns `undefined` |
| `window.system` | ✅ |
| `globalThis.system` | ✅ |
| Bare `system` | ✅ (same global, don't shadow it) |

Note the case-insensitive lookup: `require()` lower-cases the module name, so neither `"system"` nor `"System"` resolves.
:::

Most methods are callback-based (`(success, error) => void`). Wrap them with `helpers.promisify` when you prefer promises:

```js
const helpers = acode.require("helpers");
const filesDir = await helpers.promisify(system.getFilesDir);
```

::: tip `promisify` appends the callbacks for you
`helpers.promisify(func, ...args)` calls `func(...args, resolve, reject)`, so leading arguments are passed positionally:

```js
const parent = await helpers.promisify(system.getParentPath, "/a/b/c.txt");
```

The `system` methods never read `this`, so destructuring them (`const { getFilesDir } = system`) is safe.
:::

::: danger No plugin-declared permission gates any of this
The Android permissions these methods depend on are merged into the **app's** manifest at build time by the plugin's own `plugin.xml`, so they are already granted to Acode. A plugin *can* declare a `permissions` array in its manifest, but that array is read only by the native `Tee` plugin, which copies the strings into a **token-scoped** list that `ctx.grantedPermission()` / `ctx.listAllPermissions()` echo back — nothing in `src/` consults it before dispatching a `System` action, and there is no consent prompt.

So any installed plugin can call `system.*` freely, including `launchApp`, `httpStream` and the storage-manager helpers. Treat the module as fully trusted, and never forward untrusted input straight into it.
:::

## Files

### `getFilesDir(success, error)`

Resolves the app's internal files directory path. This is the `$PREFIX` used by the terminal/Executor sandbox.

```js
const filesDir = await helpers.promisify(system.getFilesDir);
```

### `getParentPath(path, success, error)`

Resolves the parent directory of `path`.

### `listChildren(path, success, error)`

Lists the children of a directory path. Success receives an array of entries.

### `mkdirs(path, success, error)`

Recursively creates directories.

### `fileExists(path, countSymlinks, success, error)`

Checks whether a file exists. `countSymlinks` is a boolean passed as a string (`String(countSymlinks)`). Success receives a **number**, not a boolean — compare with `result == 1`, which is exactly what Acode's own `Terminal.js` does.

```js
const exists = (await helpers.promisify(system.fileExists, path, false)) == 1;
```

### `copyToUri(srcUri, destUri, fileName, success, error)`

Copies a file to a destination uri under `fileName`.

### `writeText(path, content, success, error)`

Writes text content to a file path.

### `deleteFile(path, success, error)`

Deletes a file path.

### `createSymlink(target, linkPath, success, error)`

Creates a symlink at `linkPath` pointing to `target`.

### `setExec(path, executable, success, error)`

Marks a file path as executable (`executable` is a boolean passed as a string).

### `extractAsset(assetName, destinationPath, success, error)`

Extracts an app asset to a destination path. Used by the terminal installer to unpack `alpine.rootfs`.

### `getNativeLibraryPath(success, error)`

Resolves the directory where native libraries are stored. This is `$NATIVE_DIR`.

::: warning Defined twice
`getNativeLibraryPath` appears twice in `www/plugin.js` with an identical body; the second definition wins. Behaviour is unchanged, but do not be surprised by the duplicate.
:::

## Storage management

### `isManageExternalStorageDeclared(success, error)`

Checks whether the app declares all-files access in its manifest.

### `hasGrantedStorageManager(success, error)`

Checks whether the app has been granted "All files access".

### `requestStorageManager(success, error)`

Requests the "All files access" permission.

### `manageAllFiles(success, error)`

Opens the system screen to grant all-files access.

### `isExternalStorageManager(success, error)`

Checks whether the app is currently an external storage manager.

## Permissions

### `hasPermission(permission, success, error)`

Checks whether a runtime permission is granted. `permission` is an Android manifest constant such as `android.permission.CAMERA`. Success receives a boolean.

### `requestPermission(permission, success, error)`

Requests a single runtime permission.

### `requestPermissions(permissions, success, error)`

Requests multiple runtime permissions at once.

## App & device info

### `getAppInfo(success, error)`

Resolves information about the Acode app: `{ versionName, versionCode, label, firstInstallTime, lastUpdateTime }`.

### `getInstaller(success, error)`

Resolves the package that installed the app (used by `window.appInstallSource`).

### `getAndroidVersion(success, error)`

Resolves the Android OS version.

### `getArch(success, error)`

Resolves the device architecture (e.g. `arm64-v8a`). Acode's terminal installer uses this to pick the proot/axs/Alpine bundle, and supports only `arm64-v8a`, `armeabi-v7a` and `x86_64`.

### `getWebviewInfo(success, error)`

Resolves WebView information: `{ versionName, packageName, versionCode }`. Used by the About page and by `acode.exec("…")` device-info output to report the WebView build.

### `isPowerSaveMode(success, error)`

Checks whether the device is in power-save mode.

### `getGlobalSetting(key, success, error)`

Reads a global Android setting by key. Acode reads `animator_duration_scale` from here to match system animation timing.

### `clearCache(success, error)`

Clears the app's cache.

## File actions & sharing

### `fileAction(fileUri, filename, action, mimeType, error?)`

Launches an Android intent for a file. `action` is one of `VIEW`, `EDIT`, `SEND`, or `RUN` (the app prepends `android.intent.action.`). Arguments are flexible: the wrapper inspects argument types and shifts them, so all of `fileAction(uri, filename, action, mimeType, onFail)`, `fileAction(uri, action, mimeType, onFail)` and `fileAction(uri, action, onFail)` work. When an optional callback slot is not a function it is replaced with a no-op.

```js
system.fileAction(fileUri, filename, "VIEW", "text/plain");
```

::: warning `fileAction` never reports success
The success callback is hard-coded to an empty function inside the wrapper, so only `onFail` is ever invoked. If you need to know whether the viewer opened, check the resulting file state yourself.
:::

### `shareText(text, success, error)`

Shares a text string through the system share sheet.

### `openInBrowser(src)`

Opens a url in the system browser. Both callbacks are `null`, so failures are silent.

### `inAppBrowser(url, title, showButtons, disableCache)`

Opens a url in Acode's in-app browser. Returns an object with `onOpenExternalBrowser` and `onError` callbacks that can be assigned. Both start as `null`; if the native layer fires before you assign them, Acode logs `handler is not set` / `error callback not handled` and the event is lost.

```js
const browser = system.inAppBrowser(url, title, true, false);
browser.onOpenExternalBrowser = (url) => console.log("opened externally", url);
browser.onError = (err) => console.error(err);
```

### `launchApp(app, className, extras?, success?, error?)`

Launches an Android activity by package and class name, optionally passing intent extras (string/number/boolean values).

```js
system.launchApp(
  "com.example.app",
  "com.example.app.MainActivity",
  { user: "example", premium: true },
  (msg) => console.log(msg),
  (err) => console.error(err),
);
```

## Shortcuts

### `addShortcut(shortcut, success, error)`

Adds a home-screen shortcut. `shortcut` is `{ id, label, description, icon, action, data }`.

::: warning `addShortcut` assigns to an undeclared global
The wrapper reads `shortcut.action` into a bare `action` identifier that was never declared with `var` alongside the other fields. The correct value is still passed to the native layer, but a global `window.action` is created as a side effect in sloppy mode. There is no fix on the JavaScript side — use the value yourself and don't read `window.action`.
:::

### `removeShortcut(id, success, error)`

Removes a shortcut by id.

### `pinShortcut(id, success, error)`

Pins a shortcut.

### `pinFileShortcut(shortcut, success, error)`

Pins a file shortcut. Unlike `addShortcut`, the object is forwarded to native **whole** — its shape is `{ id, label, description?, icon?, uri }` (`uri` is required), and it is not flattened into positional args.

## Intents

### `getCordovaIntent(success, error)`

Resolves the intent that launched the app (for handling external open requests): `{ uris?, action, data, type, package, extras }`.

### `setIntentHandler(handler, onerror)`

Registers a handler for intents received while the app is running. `handler` receives the intent data. Note the handler is passed as the **success** callback of a single-shot native call, so it fires once.

## Text comparison

Used by the editor's dirty-tracking and file-change detection. Both methods compare in a background thread. Unlike everything else in this module they are **promise-based already** — no `promisify` needed. Each resolves `true` when the values **differ**, `false` when they match.

### `compareFileText(fileUri, encoding, currentText): Promise<boolean>`

Reads the file at `fileUri` and compares it to `currentText`. Resolves `true` when the content **differs**, `false` when it matches.

### `compareTexts(text1, text2): Promise<boolean>`

Compares two strings. Resolves `true` when they **differ**, `false` when equal.

```js
const changed = await system.compareFileText(file.uri, file.encoding, text);
```

## UI

### `setUiTheme(systemBarColor, theme, success?, error?)`

Sets the Android system bar colors to match a theme. `systemBarColor` is a hex color; `theme` is the theme id. A pure white color is mapped to `#fffffe` (both `#ffffff` and `#ffffffff` are rewritten) so status bar icons stay visible. On success the wrapper also calls `window.statusbar.setBackgroundColor(systemBarColor)` before invoking your `onSuccess`.

### `setInputType(type, success, error)`

Changes the soft-keyboard input type. Acode uses this to switch between `NORMAL` and the app's configured keyboard mode when dialogs open and close.

### `setNativeContextMenuDisabled(disabled, success, error)`

Enables or disables the native context menu on the WebView. The flag is coerced with `String(!!disabled)`. Use it when you render your own long-press menu.

## HTTP streaming <Badge type="tip" text="new" />

### `httpStream(url, options?): Promise<Response>`

Performs an HTTP request and streams the response body to JavaScript as a WHATWG `ReadableStream` of `Uint8Array` chunks. This is the one member of the module that returns a real `Response`, and the most useful one for plugins that consume SSE or large downloads.

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `method` | `string` | `"GET"` | |
| `headers` | `Record<string, string>` | — | Normalised into a `Headers` object |
| `body` | `string` | — | Sent as UTF-8 unless `bodyIsBase64` |
| `bodyIsBase64` | `boolean` | `false` | Body is base64-decoded |
| `followRedirects` | `boolean` | `true` | |
| `connectTimeout` | `number` | `30000` | ms |
| `readTimeout` | `number` | `0` | ms, `0` = no timeout |
| `chunkSize` | `number` | `32768` | Requested native chunk size in bytes |
| `signal` | `AbortSignal` | — | Aborting cancels the native request |

```js
const res = await system.httpStream("https://example.com/events", {
  signal: controller.signal,
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop();
  for (const line of lines) {
    if (line.startsWith("data:")) onEvent(line.slice(5).trim());
  }
}
```

::: warning Chunk boundaries are arbitrary
The native layer does **no** parsing at all — no SSE, no provider-specific framing — it just forwards raw byte chunks, which may split multi-byte UTF-8 characters in half. Buffer and decode yourself, as above. A 4xx/5xx status is a normal response (the promise resolves); only transport failures reject. Cancelling the reader (or aborting `options.signal`) cancels the underlying native request; if headers had not arrived yet the promise rejects with an `AbortError`, otherwise the stream is errored.
:::

## App icon <Badge type="tip" text="new" />

### `setAppIcon(iconName, success, error)`

Changes the app launcher icon at runtime. Pass `"default"` to restore the original.

Valid ids: `default`, `pro`, `midnight_circuit`, `aurora_pulse`, `terminal_glow`, `solar_flare`, `blueprint`, `pixel_party`, `prism`, `porcelain`, `tangerine`, `tidal`, `lilac`, `volt`, `cobalt`, `glacier`. (`pro` additionally requires the Pro purchase.)

::: warning Cosmetic only
This changes the launcher icon of the whole Acode app — it is not per-plugin and it affects every user of that install. Use it from an explicit user action in your plugin's settings, and restore `"default"` when disabled.
:::

## Reward status <Badge type="tip" text="new" />

### `getRewardStatus(success, error)`

Resolves the state of Acode's "remove ads" reward pass as either a JSON **string** or a plain string — Acode's own wrapper `JSON.parse`s whichever it gets:

```js
{
  isActive, canRedeem, redeemDisabledReason,
  adFreeUntil, lastExpiredRewardUntil, remainingMs,
  redemptionsToday, remainingRedemptions, maxRedemptionsPerDay,
  maxActivePassMs, hasPendingExpiryNotice, expiryNoticePendingUntil,
  grantedDurationMs?, appliedDurationMs?, offerId?
}
```

### `redeemReward(offerId, success, error)`

Redeems an offer and resolves with the same shape. Both take callbacks, not promises.

::: warning Ad-gating logic lives in Acode
Acode's own ads check is `!config.HAS_PRO && adRewards.canShowAds()`, so a redemptions UI belongs to Acode's settings, not to your plugin. A plugin that surfaces `getRewardStatus()` is exposing Acode's monetisation internals and will show numbers that disagree with what Acode actually enforces — check `config.HAS_PRO` and prefer not shipping this UI at all.
:::