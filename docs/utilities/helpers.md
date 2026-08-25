# Helpers

The `helpers` module is a collection of small utility functions used across Acode and exposed to plugins.

Require it with `acode.require('helpers')`.

```js
const helpers = acode.require("helpers");
```

## Strings & parsing

### `parseJSON(string): any | null`

Parses a JSON string. Returns `null` when the input is empty or cannot be parsed (never throws).

```js
helpers.parseJSON('{"a": 1}'); // { a: 1 }
helpers.parseJSON("not json"); // null
```

### `fixFilename(name: string): string`

Removes line breaks (`\r\n`, `\r`, `\n`) and tabs from a name and trims it.

```js
helpers.fixFilename("my\nfile.txt"); // "myfile.txt"
```

### `uuid(): string`

Returns a unique id string (timestamp + random, base-36).

### `formatDownloadCount(count: number): string`

Formats a download count into a short human-readable string using `K`/`M`/`B`/`T` units.

```js
helpers.formatDownloadCount(15400); // "15.4K"
helpers.formatDownloadCount(2_500_000); // "2.5M"
```

## Errors

### `errorMessage(err, ...args): string`

Builds a human-readable error message from an `Error`, a string, or a fallback. Extra `args` are appended with `<br>` separators, and URL-like arguments are rewritten to their virtual path via [`getVirtualPath`](#getvirtualpathpath-string-string).

### `error(err, ...args): Promise`

Shows an alert dialog with the error message. Returns a promise that resolves when the dialog is closed. If the error has `code === 0` a toast is shown instead.

```js
try {
  await something();
} catch (err) {
  await helpers.error(err);
}
```

## Types

### `isDir(type: string): boolean`

Returns `true` for `'dir'`, `'directory'`, or `'folder'`.

### `isFile(type: string): boolean`

Returns `true` for `'file'` or `'link'`.

### `isBinary(file: string): boolean`

Returns `true` if the file name/uri looks like a binary file.

## URLs & paths

### `getVirtualPath(path: string): string`

Replaces the matching part of a url with the alias name of the storage it belongs to (from `localStorage.storageList`). Content uris are resolved to their primary (virtual) address first, if available.

```js
helpers.getVirtualPath("content://com.android.externalstorage.documents/...");
```

### `toInternalUri(uri: string): Promise<string>`

Resolves a `file://` (or other) uri to an internal `cdvfile://` url using `resolveLocalFileSystemURL`.

```js
const internalUrl = await helpers.toInternalUri(file.uri);
```

### `updateUriOfAllActiveFiles(oldUrl, newUrl)`

Updates the `uri` of every open file whose uri starts with `oldUrl`, replacing it with `newUrl` (keeping the filename). Pass `null` as `newUrl` to clear uris. Afterwards calls `editorManager.onupdate("file-delete")` and emits the `update` event with `"file-delete"` as its sub-action.

### `createFileStructure(uri, pathString, isFile = true): Promise<{ uri, parentUri, created, type }>`

Creates nested folders (and optionally a final file) under `uri`, walking `pathString` split on `/`. Handles special-case SAF/ExternalStorage/Termux/Acode-terminal document uris.

Returns an object describing the first created entry:
- `uri` - url of the first created entry (or the target uri if nothing was created)
- `parentUri` - parent uri of the first created entry
- `created` - `true` when at least one entry was created
- `type` - `'file'` or `'folder'`

Throws if an existing entry's type does not match the expected type.

```js
const res = await helpers.createFileStructure(
  "file:///storage/emulated/0/Acode",
  "project/src/index.js",
  true,
);
```

## Files & sorting

### `getIconForFile(filename: string): string`

Returns the icon class string for a filename (e.g. `"file file_type_default file_type_js"`).

### `sortDir(list, fileBrowser, mode = "both"): Array`

Sorts a list of file entries into directories-first order. `mode` can be `'both'`, `'file'`, or `'folder'`. Honors `sortByName` and `showHiddenFiles` settings from `fileBrowser`. Sets `item.icon` and `item.disabled` (when mode is `'folder'`) as a side effect.

## Promises & timing

### `promisify(func, ...args): Promise`

Wraps a callback-style function that calls `(resolve, reject)` as its trailing arguments.

```js
const value = await helpers.promisify(system.getFilesDir);
```

### `checkAPIStatus(): Promise<boolean>`

Fetches `API_BASE/status`. Resolves `true` when the Acode API is reachable, `false` on any error.

### `debounce(func, wait): Function`

Returns a debounced version of `func` that only runs after `wait` ms without further calls.

```js
window.addEventListener("resize", helpers.debounce(onResize, 200));
```

## DOM & HTML

### `parseHTML(html): HTMLElement | HTMLElement[]`

Parses an HTML string with `DOMParser`. Returns the single element when there is exactly one child, otherwise an array of children.

```js
const el = helpers.parseHTML("<div>Hello</div>");
```

## Deprecation helpers

### `defineDeprecatedProperty(obj, name, getter, setter)`

Defines a property on `obj` that warns to the console whenever it is read or written.

### `decodeText(arrayBuffer, encoding = "utf-8"): string`

::: warning Deprecated
Use the `encodings` module instead.
:::

Decodes an `ArrayBuffer` to a string. When `encoding` is `"json"`, the result is parsed as JSON.

## Ads (free builds only)

These are used by Acode internally to manage ads on the free build. They are no-ops / return `false` on Pro.

| Method | Description |
|--------|-------------|
| `canShowAds()` | `true` when the build is not Pro and ads are available |
| `showInterstitialIfReady()` | Shows an interstitial ad if loaded; resolves `true` when shown |
| `showAd()` | Displays a banner ad on the current page (if eligible) |

## Purchasing

| Method | Description |
|--------|-------------|
| `isIapAvailable()` | `true` when the In-App Purchase plugin is present and available |
| `shouldAllowExternalPurchase()` | `true` when IAP is unavailable and the app was not installed from the Play Store |

## Mtime helpers

Used by the editor's disk-conflict tracking.

| Method | Description |
|--------|-------------|
| `normalizeMtime(value): number \| null` | Converts a `Date` or timestamp to a numeric ms value (or `null`) |
| `getStatMtime(stat): number \| null` | Extracts an mtime from a `stat` object (`modifiedDate`, `lastModified`, or `mtime`) |

## Related APIs

- [Config](../global-apis/config.md) - `HAS_PRO` and other app constants used by the helpers
- [File System (fs)](./fs.md) - low-level file operations
