# Other Global Utilities

These extra global APIs provide essential information about asset directories, storage locations, app features, and system specifications.

::: info
Verified against Acode **v1.13.5** (`CHANGELOG.md:3`). Globals are assigned in `src/main.js`; requirable modules are registered with `this.define(...)` in `src/lib/acode.js`.
:::

## ASSETS_DIRECTORY
`<string>` The directory where all the assets are stored.

Set to `Url.join(cordova.file.applicationDirectory, "www")` at `src/main.js:153`.

## CACHE_STORAGE
`<string>` The directory where all the cache files are stored.

`src/main.js:158-161` prefers `cordova.file.externalCacheDirectory`, falls back to `cordova.file.cacheDirectory`, and re-falls-back at `src/main.js:279-280` if the `plugins` directory cannot be created.

## DATA_STORAGE
`<string>` The directory where all the data files are stored.

`src/main.js:154-157` — `cordova.file.externalDataDirectory`, else `cordova.file.dataDirectory`. This is where `KEYBINDING_FILE` and `Acode.log` live.

## PLUGIN_DIR
`<string>` The directory where all the plugins are stored.

Always `Url.join(DATA_STORAGE, "plugins")` (`src/main.js:163`, recomputed at `src/main.js:281`).

## DOES_SUPPORT_THEME
`<boolean>` Whether the app supports theme or not.

A feature probe at `src/main.js:234-250`: it renders a test element sized with `var(--test-height)` and checks whether the computed box has a non-zero height.

## Pro / free build detection
`config.HAS_PRO` is the supported way to detect a paid build or an in-app upgrade.

::: danger
Earlier versions of this page documented a global named **`IS_FREE_VERSION`**. It does not exist in v1.13.5 — nothing in the source assigns it. Use the read-only config value instead:

```js
const config = acode.require('config');
console.log(config.HAS_PRO); // true for a paid build or a purchased upgrade
```

`src/main.js` derives it from the package name (`/(free)$/` on `BuildInfo.packageName`), from `localStorage.acode_pro`, from an `iap.getPurchases` lookup for the `acode_pro_new` product, and finally from the logged-in account's `acode_pro` flag (`src/main.js:167`, `:208`, `:212-220`, `:396-401`, `:534-547`). Because those writes go to the *raw* config object, they bypass the read-only `Proxy` that plugins get — so `config.HAS_PRO` is readable and up-to-date, but not writable from plugin code.
:::

## KEYBINDING_FILE
`<string>` The file where all the keybindings are stored.

`Url.join(DATA_STORAGE, ".key-bindings.json")` (`src/main.js:164`). Acode watches this file with `sdcard.watchFile` and hot-reloads command bindings when it changes (`src/main.js:740-751`).

## ANDROID_SDK_INT
`<number>` The Android SDK version.

Resolved via `system.getAndroidVersion` on `deviceready`, falling back to `Number.parseInt(device.version)` (`src/main.js:228-233`). App code branches on it — the external-storage permissions are only requested below API 33 (`src/main.js:255-258`) and ad placement only changes above API 29 (`src/lib/startAd.js:29`, `:76`).

### Other globals worth knowing

| Global | Type | Where |
|---|---|---|
| `window.acode` | `Acode` instance | `src/main.js:251` |
| `window.editorManager` | editor manager | `src/main.js:697` — see [Editor Manager](./editor-manager.md) |
| `window.actionStack` | back-navigation stack copy | `src/main.js:696` — see [Action Stack](../advanced-apis/action-stack.md) |
| `window.addedFolder` | opened-folder list | `src/main.js:150` — see [Added Folder](./added-folder.md) |
| `window.toast` | toast function | `src/main.js:152` — same object as `acode.require("toast")` |
| `window.log` | `(level, message) => void` | `src/main.js:165` — the bound `Logger#log`; levels `error` \| `warn` \| `info` \| `debug` |
| `window.app` | `<body>` element | `src/main.js:148` |
| `window.root` | `#root` element | `src/main.js:149` |
| `window.appInstallSource` | readonly string getter | `src/main.js:190-199`; assigning logs `appInstallSource is readonly` |
| `window.ace` | Ace compat shim | `src/main.js:1046-1059` — see [Ace](./ace.md) |
| `window.Executor` | process executor | clobbered by the terminal Cordova plugin — see [Executor](../advanced-apis/executor.md) |

`window.log` is the only public window into the app's log file: `src/lib/logger.js` buffers up to 1000 entries and appends them to `Url.join(DATA_STORAGE, "Acode.log")` every 30 s and on `pause`.

## `acode.require("helpers")` <Badge type="tip" text="new" />

```js
const helpers = acode.require('helpers');
```

::: info
The module lives at **`src/utils/helpers.js`** (not `src/lib/helpers.js`), and is registered in `src/lib/acode.js:412`. It is a plain object with 29 members.
:::

### Async / interop

#### `promisify(func, ...args): Promise`
The workhorse of the API — it turns any Cordova-style `(…args, success, error)` function into a promise.

```js
promisify(func, ...args) {
		return new Promise((resolve, reject) => {
				func(...args, resolve, reject);
		});
}
```

Your arguments are forwarded first and `resolve` / `reject` are **appended last**, which is exactly the Cordova callback convention. A thrown error inside `func` rejects the promise (it runs inside the `Promise` executor).

```js
const helpers = acode.require('helpers');
const system = window.system;

// No arguments — the callbacks become the first two parameters.
const filesDir = await helpers.promisify(system.getFilesDir);

// One argument.
const parent = await helpers.promisify(system.getParentPath, '/storage/emulated/0/Downloads');

// Several arguments, in order.
const exists = await helpers.promisify(system.fileExists, '/sdcard/x.txt', false);
```

::: warning
- It does **not** check that `func` exists — `helpers.promisify(undefined)` calls `undefined(...)` inside the executor, so the promise **rejects** with a `TypeError` rather than hanging. Guard the plugin is present.
- It only works for functions whose last two parameters are `success` and `error`. Methods that take no callbacks at all (`system.openInBrowser`) never settle it, and methods that already return a promise (`system.compareTexts`, `webview.create`) must be awaited directly.
- `resolveLocalFileSystemURL` is also `(uri, success, error)`, so `await helpers.promisify(window.resolveLocalFileSystemURL, url)` gives you the raw Cordova entry.
:::

#### `debounce(func, wait): Function`
Returns a debounced wrapper that delays `func` by `wait` ms after the last call. `this` and the arguments of the most recent call are preserved.

```js
const helpers = acode.require('helpers');
const onResize = helpers.debounce(() => layout(), 200);
window.addEventListener('resize', onResize);
```

#### `checkAPIStatus(): Promise<boolean>`
`fetch`es `Url.join(config.API_BASE, "status")` and resolves `res.ok`. Any network error is logged via `window.log("error", …)` and resolves `false` — it never rejects.

```js
if (!(await helpers.checkAPIStatus())) {
		acode.require('toast')('Cannot reach the plugin registry');
}
```

### Errors and user feedback

| Member | Returns | Notes |
|---|---|---|
| `errorMessage(err, ...args): string` | Message | Pure formatter. Uses `err` directly if it's a non-empty string, `err.message` for `Error`, else the localized `strings["an error occurred"]`. Extra args matching `/^(content\|file\|ftp\|sftp\|https?):/` are rewritten through `getVirtualPath()` and appended with `<br>` |
| `error(err, ...args): PromiseLike<void> \| undefined` | — | Shows `alert(strings.error, errorMessage(err, ...args))`; the promise resolves when the user dismisses that alert. **`err.code === 0` is special-cased**: it calls the global `toast(err)` and returns `undefined` synchronously |
| `formatDownloadCount(downloadCount): string` | e.g. `"1.2K"` | Units `""`, `K`, `M`, `B`, `T`; `toFixed(2)` below 10, `toFixed(1)` otherwise, trailing zeros trimmed |

```js
const helpers = acode.require('helpers');
const fs = acode.require('fs');
const url = acode.joinUrl(DATA_STORAGE, 'notes.md');

try {
		await fs(url).writeFile('hello');
} catch (error) {
		// Resolves once the user closes the error dialog.
		await helpers.error(error, url);
}
```

### Files, paths and stats

| Member | Returns | Notes |
|---|---|---|
| `toInternalUri(uri): Promise<string>` | Internal URL | Resolves `window.resolveLocalFileSystemURL(uri, …)` → `entry.toInternalURL()`. Rejects with the raw Cordova error. Same function as [`acode.toInternalUrl(url)`](./acode.md#tointernalurl-url-string-promise-string) and `acode.require("toInternalUrl")` |
| `createFileStructure(uri, pathString, isFile = true): Promise<{ uri, parentUri, created, type }>` | Result object | Creates every missing folder along `pathString` (split on `/`). `type` is `"file"` or `"folder"`, `created` is `false` when the leaf already existed. Throws `'<name> already exists as a <type>, expected <type>.'` on a kind mismatch |
| `fixFilename(name): string` | Cleaned name | Strips runs of `\r\n`, `\r`, `\n` and tabs, then trims. Falsy input returns as-is |
| `getVirtualPath(url): string` | Display path | `content:` URLs collapse through `Uri.getPrimaryAddress()`; other schemes replace a matching added-storage root from `localStorage.storageList` with its user-chosen name |
| `updateUriOfAllActiveFiles(oldUrl, newUrl): void` | — | Re-points every open `editorManager.files` entry whose uri starts with `oldUrl` to `Url.join(newUrl, file.filename)` (or `null` when `newUrl` is falsy), then triggers a `"file-delete"` update. **Mutates live editor state** |
| `isBinary(file): boolean` | — | `isBinaryFile` from `src/utils/binaryExtensions.js`. Accepts a path string or an object with `mime`/`type` and `url`/`path`/`name`; checks explicit text MIME types and extensions first, then binary ones |
| `normalizeMtime(value): number \| null` | Epoch ms | `Date` → `getTime()`, otherwise `Number(value)`; `null` for `null`/`undefined`/non-finite |
| `getStatMtime(stat): number \| null` | Epoch ms | `normalizeMtime(stat?.modifiedDate ?? stat?.lastModified ?? stat?.mtime)` |

```js
const helpers = acode.require('helpers');
const Url = acode.require('Url');

const { uri, created } = await helpers.createFileStructure(
	Url.join(PLUGIN_DIR, 'com.example.plugin'),
	'assets/icons/logo.svg',
);
if (!created) console.log('already existed at', uri);
```

### Data, parsing and types

| Member | Returns | Notes |
|---|---|---|
| `parseJSON(string): object \| array \| null` | Parsed value | Falsy input or any parse error → `null` |
| `parseHTML(html): Element \| Element[]` | DOM node(s) | `DOMParser` with `text/html`. Returns `children[0]` when there is exactly one body child, otherwise `Array.from(children)` |
| `uuid(): string` | Short id | `Date.now() + random`, base-36. Not a RFC 4122 UUID |
| `isDir(type): boolean` | — | `/^(dir\|directory\|folder)$/` |
| `isFile(type): boolean` | — | `/^(file\|link)$/` |

::: warning
`parseHTML` returns **an array** whenever the markup has zero or 2+ body children. Guard before using the result as a single element.
:::

### Icons

| Member | Returns | Notes |
|---|---|---|
| `getIconForFile(filename): string` | CSS class | `fileIcons.icon({ kind: 'file', name: filename })` |
| `getIconForFolder(name, options = {}): string` | CSS class | `fileIcons.icon({ kind: 'folder', name, expanded: options.expanded, isRoot: options.isRoot })` |

::: tip
Both go straight to the app-internal icon registry, so they work from anywhere — including outside a plugin's main script, where `acode.require("fileIcons")` deliberately throws. For icons **you** register, use [`acode.require("fileIcons")`](../utilities/file-icons.md), which is scoped to the requesting `<script>`.
:::

```js
const $icon = document.createElement('span');
$icon.className = helpers.getIconForFolder('src', { expanded: true });
```

### File-browser helpers

#### `sortDir(list, fileBrowser, mode = 'both'): Array`
Normalizes and orders a mixed entry list for a file-browser view. It **mutates the input objects** and returns `dir.concat(file)` — folders always first, each group sorted case-insensitively by name only when `fileBrowser.sortByName` is truthy.

Per item it will: default `name` from `path.basename(item.url)`; derive `isDirectory` from `type` when missing; default `type` to `"dir"`/`"file"`; copy `uri` into `url`; drop dot-files unless `fileBrowser.showHiddenFiles`; set `icon`; and set `disabled = true` on every file when `mode === 'folder'`.

::: warning
Only entries with `item.isFile === true` land in the `file` bucket. If an object has neither `isDirectory` nor `isFile`, it is dropped from the result entirely.
:::

### Ads and in-app purchases

| Member | Returns | Notes |
|---|---|---|
| `canShowAds(): boolean` | — | `!config.HAS_PRO && adRewards.canShowAds()` |
| `showInterstitialIfReady(): Promise<boolean>` | Shown? | Shows a preloaded interstitial, resolving `true` only if one was shown |
| `showAd(): void` | — | Requests a banner for the topmost `wc-page:not(#root)`, but only when `canShowAds()` and `innerHeight * devicePixelRatio > 600` |
| `isIapAvailable(): boolean` | — | Whether the `iap` Cordova plugin exists and reports availability |
| `shouldAllowExternalPurchase(): boolean` | — | `!isIapAvailable() && !isPlayStoreInstall()` |

::: warning
These five members are **ad and billing plumbing**. Calling `showAd()` or `showInterstitialIfReady()` from a plugin puts an ad in front of your own UI. Gate them behind your own opt-in setting.
:::

### Deprecated members

#### `decodeText(arrayBuffer, encoding = 'utf-8'): string`
::: danger
Deprecated in the source (`src/utils/helpers.js:16`) — use [`acode.require("encodings").decode()`](../utilities/encoding.md) instead. `encoding` may be `"json"`, in which case the buffer is decoded as UTF-8 and then run through `parseJSON` (returning `null` on bad JSON).
:::

#### `defineDeprecatedProperty(obj, name, getter, setter): void`
Defines a property on `obj` whose accessors each log `Property '<name>' is deprecated.` to `console.warn`. Handy for keeping your own old API alive while warning callers.

```js
helpers.defineDeprecatedProperty(api, 'openFile', function () {
		return this.openFolder;
}, function (v) {
		this.openFolder = v;
});
```

### The complete member list

| Member | Signature |
|---|---|
| `promisify` | `promisify(func: Function, ...args: any[]): Promise` |
| `debounce` | `debounce(func: Function, wait: number): Function` |
| `checkAPIStatus` | `checkAPIStatus(): Promise<boolean>` |
| `error` | `error(err, ...args): PromiseLike<void> \| undefined` |
| `errorMessage` | `errorMessage(err, ...args): string` |
| `formatDownloadCount` | `formatDownloadCount(downloadCount: number): string` |
| `toInternalUri` | `toInternalUri(uri: string): Promise<string>` |
| `createFileStructure` | `createFileStructure(uri: string, pathString: string, isFile?: boolean): Promise<{ uri: string, parentUri: string, created: boolean, type: "file" \| "folder" }>` |
| `fixFilename` | `fixFilename(name: string): string` |
| `getVirtualPath` | `getVirtualPath(url: string): string` |
| `updateUriOfAllActiveFiles` | `updateUriOfAllActiveFiles(oldUrl: string, newUrl: string): void` |
| `isBinary` | `isBinary(file: string \| object): boolean` |
| `normalizeMtime` | `normalizeMtime(value): number \| null` |
| `getStatMtime` | `getStatMtime(stat): number \| null` |
| `parseJSON` | `parseJSON(string: string): object \| array \| null` |
| `parseHTML` | `parseHTML(html: string): Element \| Element[]` |
| `uuid` | `uuid(): string` |
| `isDir` | `isDir(type: string): boolean` |
| `isFile` | `isFile(type: string): boolean` |
| `getIconForFile` | `getIconForFile(filename: string): string` |
| `getIconForFolder` | `getIconForFolder(name: string, options?: { expanded?: boolean, isRoot?: boolean }): string` |
| `sortDir` | `sortDir(list: object[], fileBrowser: object, mode?: "both" \| "file" \| "folder"): object[]` |
| `canShowAds` | `canShowAds(): boolean` |
| `showInterstitialIfReady` | `showInterstitialIfReady(): Promise<boolean>` |
| `showAd` | `showAd(): void` |
| `isIapAvailable` | `isIapAvailable(): boolean` |
| `shouldAllowExternalPurchase` | `shouldAllowExternalPurchase(): boolean` |
| `decodeText` | `decodeText(arrayBuffer: ArrayBuffer, encoding?: string): string` *(deprecated)* |
| `defineDeprecatedProperty` | `defineDeprecatedProperty(obj: object, name: string, getter: Function, setter: Function): void` |

## `acode.require("config")` <Badge type="tip" text="new" />

```js
const config = acode.require('config');
```

The object in `src/lib/config.js` (58 lines) holds the app's compile-time constants.

### It is read-only — every mutation is blocked

`src/lib/acode.js:356-381` wraps the config in a `Proxy` before registering it. There is **no `get` trap**, so reads are normal, but four traps log a `[Security Alert]` warning and return `true` (silently "succeeding" without changing anything):

| Attempt | Console message |
|---|---|
| `config.X = 1` | `[Security Alert] Attempt to modify read-only config property 'X' blocked.` |
| `Object.defineProperty(config, "X", …)` | `[Security Alert] Attempt to define property 'X' on read-only config blocked.` |
| `delete config.X` | `[Security Alert] Attempt to delete property 'X' on read-only config blocked.` |
| `Object.setPrototypeOf(config, …)` | `[Security Alert] Attempt to change prototype of read-only config blocked.` |

`HAS_PRO` is a getter/setter pair on the underlying object; because the proxy has no `set` forwarding, `config.HAS_PRO = true` is blocked too. Use [`acode.require("settings")`](../editor-components/settings.md) for anything the user can change.

### The real keys

| Key | Value |
|---|---|
| `BASE_URL` | `"https://acode.app"` |
| `API_BASE` | `"https://acode.app/api"` — the base for `helpers.checkAPIStatus()` and the plugin registry |
| `DOCS_URL` | `"https://docs.acode.app"` |
| `GITHUB_URL` | `"https://github.com/Acode-Foundation/Acode"` |
| `TELEGRAM_URL` | `"https://t.me/foxdebug_acode"` |
| `DISCORD_URL` | `"https://discord.gg/nDqZsh7Rqz"` |
| `TWITTER_URL` | `"https://x.com/foxbiz_io"` |
| `INSTAGRAM_URL` | `"https://www.instagram.com/foxbiz.io/"` |
| `FOXBIZ_URL` | `"https://foxbiz.io"` |
| `PLAY_STORE_URL` | getter — a Play Store listing URL built from `BuildInfo.packageName` |
| `FEEDBACK_EMAIL` | `"acode@foxdebug.com"` |
| `ERUDA_CDN` | `"https://cdn.jsdelivr.net/npm/eruda"` |
| `SUPPORTED_EDITOR` | `"cm"` (CodeMirror 6 is the only engine) |
| `DEFAULT_FILE_NAME` | `"untitled.txt"` |
| `DEFAULT_FILE_SESSION` | `"default-session"` |
| `LOG_FILE_NAME` | `"Acode.log"` |
| `CUSTOM_THEME` | `'body[theme="custom"]'` |
| `CONSOLE_PORT` | `8159` |
| `SERVER_PORT` | `8158` |
| `PREVIEW_PORT` | `8158` |
| `VIBRATION_TIME` | `30` |
| `VIBRATION_TIME_LONG` | `150` |
| `SCROLL_SPEED_NORMAL` | `"NORMAL"` |
| `SCROLL_SPEED_FAST` | `"FAST"` |
| `SCROLL_SPEED_FAST_X2` | `"FAST_X2"` |
| `SCROLL_SPEED_SLOW` | `"SLOW"` |
| `SIDEBAR_SLIDE_START_THRESHOLD_PX` | `20` |
| `FILE_NAME_REGEX` | `/^((?![:<>"\\\|\?\*]).)*$/` — validation for user-entered file names |
| `FONT_SIZE` | `/^[0-9\.]{1,3}(px\|rem\|em\|pt\|mm\|pc\|in)$/` |
| `SKU_LIST` | `Object.freeze(["crystal", "bronze", "silver", "gold", "platinum", "titanium"])` |
| `HAS_PRO` | getter/setter `boolean` — read-only through the proxy |

```js
const config = acode.require('config');
const status = await acode.require('helpers').checkAPIStatus();
console.log(status ? 'API up' : 'API down', config.API_BASE);
```

## `acode.require("orientation")` <Badge type="tip" text="new" />

```js
const orientation = acode.require('orientation');
```

Temporary orientation requests for the main WebView's **fullscreen session**. Both members go through `cordova.exec(…, "System", "set-fullscreen-orientation", [mode])`, which resolves when the native side accepts the request.

| Member | Signature | Returns |
|---|---|---|
| `lock` | `lock(mode: "landscape" \| "portrait"): Promise<void>` | Rejects with `TypeError("Orientation must be landscape or portrait.")` for any other value |
| `unlock` | `unlock(): Promise<void>` | Sends `null`, restoring the previous policy |

```js
acode.require('orientation').lock('landscape');
// … later
await acode.require('orientation').unlock();
```

::: warning
The source header calls these *"Temporary orientation requests for the main WebView's fullscreen session"* (`src/lib/orientation.js:1`) and `index.d.ts:188` notes `lock()` *"Requires a foreground browser fullscreen session"*. Call `unlock()` from your plugin's unmount handler so a crashed session cannot leave the app locked sideways.
:::

## `acode.require("fullscreen")` <Badge type="tip" text="new" />

```js
const fullscreen = acode.require('fullscreen');
```

Opt-in **Android Back** delivery for whoever currently owns browser fullscreen. It is not a request-to-enter/exit API — the DOM's `requestFullscreen()` / `exitFullscreen()` still do that. The module only decides whether the native Back button is routed to your callback instead of the app's back stack.

#### `setBackHandler(callback): Promise<void>`

| Parameter | Type | Notes |
|---|---|---|
| `callback` | `(() => void \| Promise<void>) \| null` | Function to run on Back, or `null` to release Back |

| Rejection | Condition |
|---|---|
| `TypeError("Back handler must be a function or null.")` | Anything other than a function or `null` |
| `Error("Back handler requires fullscreen.")` | A function was passed while no element is fullscreen |
| `Error("Fullscreen session changed.")` | The fullscreen owner changed while the native call was queued |

Behaviours to design around:

- The fullscreen owner is resolved by walking `document.fullscreenElement` **through shadow roots** (`fullscreen.js:8-14`), so a fullscreen element inside a shadow tree is still detected — a naive `document.fullscreenElement` check is not enough.
- Native calls are serialised through a promise queue (`fullscreen.js:16-20`), so overlapping registrations cannot interleave.
- On `fullscreenbackbutton` your callback runs first; the module then calls `document.exitFullscreen()` itself **unless** you already did, or the session changed underneath you (`fullscreen.js:49-71`).
- If your callback throws or rejects, the module still exits fullscreen (`fullscreen.js:66-70`).
- When the fullscreen session ends for any reason, a pending handler is released automatically and a late acknowledgement cannot reinstall it (`fullscreen.js:34-46`).

```js
acode.setPluginInit('com.example.fullscreen-back', (baseUrl, $page) => {
		const fullscreen = acode.require('fullscreen');

		const onBack = () => {
				console.log('Back pressed while fullscreen');
				// Do NOT call exitFullscreen() — the module does it for you.
		};

		fullscreen.setBackHandler(onBack).catch((error) => {
				console.warn(String(error));
		});

		acode.setPluginUnmount('com.example.fullscreen-back', () => {
				fullscreen.setBackHandler(null);
		});
});
```

## Modules you can require

Every name below is registered by the `Acode` constructor in `src/lib/acode.js` (`src/lib/acode.js:383-457`). `acode.require()` lowercases the name, so casing never matters.

| `acode.require(…)` | Page |
|---|---|
| `config` | this page |
| `helpers` | this page |
| `orientation` | this page |
| `fullscreen` | this page |
| `toInternalUrl` | [`acode.toInternalUrl`](./acode.md#tointernalurl-url-string-promise-string) |
| `Url` | [Url](../utilities/url.md) |
| `fs` / `fsOperation` | [FS](../utilities/fs.md) |
| `fileIndex` | [File Index](../editor-components/file-index.md) |
| `fileList` | [fileList (deprecated)](../editor-components/file-list.md) |
| `projects` | [Projects](../utilities/projects.md) |
| `commands` | [Commands](../utilities/commands.md) |
| `keyboard` | [Keyboard](../utilities/keyboard.md) |
| `windowResize` | [Window Resize](../utilities/window-resize.md) |
| `createKeyboardEvent` | [Keyboard Event](../utilities/keyboard-event.md) |
| `encodings` | [Encoding](../utilities/encoding.md) |
| `editorLanguages` / `aceModes` | [Editor Languages](../utilities/ace-modes.md) |
| `editorThemes` | [Editor Themes](../utilities/editor-themes.md) |
| `fileIcons` | [File Icons](../utilities/file-icons.md) |
| `codemirror` | [CodeMirror packages](../utilities/codemirror.md) |
| `codeHighlight` | [Code Highlight](../utilities/code-highlight.md) |
| `@codemirror/autocomplete`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/lint`, `@codemirror/search`, `@codemirror/state`, `@codemirror/view` | [CodeMirror packages](../utilities/codemirror.md) |
| `@lezer/common`, `@lezer/highlight`, `@lezer/lr` | [CodeMirror packages](../utilities/codemirror.md) |
| `lsp` | [LSP](../advanced-apis/lsp.md) |
| `terminal` | [Terminal](../advanced-apis/terminal.md) |
| `webview` | [WebView](../advanced-apis/webview.md) |
| `actionStack` | [Action Stack](../advanced-apis/action-stack.md) |
| `intent` | [Intent](../advanced-apis/intent.md) |
| `settings` | [Settings](../editor-components/settings.md) |
| `page` | [Page](../editor-components/page.md) |
| `palette` | [Palette](../editor-components/palette.md) |
| `fileBrowser` | [File Browser](../editor-components/file-browser.md) |
| `EditorFile` | [Editor File](../editor-components/editor-file.md) |
| `addedfolder` | [Added Folder](./added-folder.md) |
| `openfolder` | [Open Folder](../utilities/open-folder.md) |
| `toast` | [Toast](../ui-components/toast.md) |
| `alert`, `confirm`, `select`, `prompt`, `multiPrompt`, `loader`, `dialogBox`, `colorPicker` | [Dialogs](../ui-components/dialogs/alert.md) |
| `selectionMenu` | [Selection Menu](../ui-components/selection-menu.md) |
| `tutorial` | [Tutorial](../ui-components/tutorial.md) |
| `sidebarApps` | [Sidebar Apps](../interface-apis/sidebar-apps.md) |
| `sideButton` | [Side Buttons](../interface-apis/side-buttons.md) |
| `contextMenu` | [Context Menu](../interface-apis/context-menu.md) |
| `inputhints` | [Input Hints](../helpers/input-hints.md) |
| `Color` | [Color](../helpers/color.md) |
| `fonts` | [Fonts](../helpers/fonts.md) |
| `themes` | [Themes](../helpers/themes.md) |
| `themeBuilder` | [Theme Builder](../helpers/theme-builder.md) |

A full method-by-method reference also lives in [Acode → Available Modules](./acode.md#available-modules).

## Internal-only modules

These files exist under `src/lib/` but are **not** registered with `acode.define()` and are not exposed on `window`. Do not plan a plugin around them.

| Source file | How it is reached today |
|---|---|
| `src/lib/ajax.js` | The app's XHR wrapper — `ajax(options)` plus the `ajax.get/post/put/patch/delete/purge` shorthands and the mutable `ajax.response` / `ajax.configure` / `ajax.onprogress` hooks on the function itself. Imported by `src/fileSystem/index.js` for the `https:` provider and by `src/main.js`. Not reachable by name — use `fetch`, `cordova.plugin.http`, or `system.httpStream` ([System](../advanced-apis/system.md)) instead |
| `src/lib/logger.js` | The `Logger` class. Not exported as a module; its `log()` method is the bound global `window.log(level, message)` |
| `src/lib/recents.js` | Recent files and folders (`addFile`, `addFolder`, `select`, `MAX: 10`, …). Internal to the "Open Recent" UI. Acode persists them in `localStorage.recentFiles` / `recentFolders`, which you *can* read yourself |
| `src/lib/searchHistory.js` | A `SearchHistory` singleton over `localStorage["acode.searchreplace.history"]`, capped at 20 items. Internal to the search & replace panel |
| `src/lib/systemConfiguration.js` | `getSystemConfiguration()` plus the `HARDKEYBOARDHIDDEN_*`, `KEYBOARDHIDDEN_*`, `KEYBOARD_*`, `NAVIGATIONHIDDEN_*`, `NAVIGATION_*`, `ORIENTATION_*` and `TOUCHSCREEN_*` constants. Only `src/handlers/keyboard.js` imports it. You can call the same native action directly: `cordova.exec(resolve, reject, "System", "get-configuration", [])` |

::: tip
`src/lib/recents.js` and `src/lib/searchHistory.js` still use `localStorage` keys you can reach, and `src/lib/systemConfiguration.js` is a thin wrapper over a documented Cordova action — so none of these are hard walls, just APIs with no stability guarantee.
:::

Here is a very simple example on how to use these APIs:
```javascript
console.log(ASSETS_DIRECTORY) // returns a string like "/path/to/assets"
console.log(acode.require('config').HAS_PRO) // true if the build is paid or the upgrade was purchased
```
