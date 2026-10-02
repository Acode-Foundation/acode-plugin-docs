# File System(fs)

The `fs` module provides a simplified API for interacting with the file system in Acode, primarily for basic file and directory operations.

`fsOperation(url)` returns a **flat handler object bound to that one URL**. There is no separate `File` or `Directory` class, and the handle has no `isFile()`, `isDirectory()`, `getName()`, `getPath()`, `getParent()` or `getUri()` method — use `await fs.stat()` to find out what the URL points at. There is also no API for creating or following symbolic links, although SFTP entries do report `isLink` / `linkTarget`.

::: info
Verified against Acode **v1.13.5** (versionCode `1011`): `src/fileSystem/index.js` plus the providers `internalFs.js`, `externalFs.js`, `ftp.js`, `sftp.js`.
:::

### Importing the Module

The `fs` module can be imported using either of the following methods:

```javascript
// Importing via requiring 'fs'
const fs = acode.require('fs');

// Importing via requiring 'fsOperation'
const fs = acode.require('fsOperation');
```

Both names are registered in `src/lib/acode.js` as aliases of the **same** `fsOperation` function (`this.define("fs", fsOperation)` and `this.define("fsOperation", fsOperation)`), and `acode.require()` lowercases the module name, so `acode.require('FS')` resolves too. The identical function is also exposed as the method [`acode.fsOperation(path)`](../global-apis/acode.md#fsoperation-file-string-file).

### Creating a File System Object

To perform file operations, you first need to create a file system object by providing a URL (path) to the file or directory. **This call is synchronous** — the handler object is built eagerly, but nothing touches the disk until you call one of its methods:

```javascript
/**
 * Create a file system object from a URL
 * @param {...string} url URL of the file or directory. Several parts are joined with Url.join().
 * @returns {FileSystem|undefined} File system object, or undefined if no provider handles the scheme
 */
const filesystem = fs(url);
```

| Input | Result |
| --- | --- |
| `fs('file:///data/user/0/com.foxdebug.acode/files/AcodeCache')` | `internalFs` provider — app-internal and `/sdcard` `file://` paths |
| `fs('content://com.android.externalstorage.documents/tree/primary%3ADownload')` | `externalFs` provider — Android SAF documents |
| `fs('ftp://user:pass@host:2121/pub/?security=explicit&mode=active')` | `Ftp` provider |
| `fs('sftp://profile-abc123/var/www/')` | `Sftp` provider — requires a native SFTP profile (`sftp.fromUrl` throws for legacy credential URLs) |
| `fs('https://example.com/plugin.json')` | Read-only HTTP provider — only `readFile` and `writeFile` exist |
| `fs('myapp://data/x.txt')` | `undefined` — no provider is registered for that scheme |

Two consequences that catch most plugins out:

- **A missing path is not an error.** `fsOperation()` never touches the disk, so it happily returns a handle for a URL that does not exist. The failure surfaces on the first method call, and `exists()` is the only method that reports it as `false` instead of rejecting. Guard with `await fs.exists()` before reading.
- **The handle is not a directory cursor.** `createFile`, `createDirectory`, `copyTo` and `moveTo` all resolve their names against this one fixed URL. To act on a sibling entry, call `fsOperation()` again with the new URL.

## File System Methods

Once you have a `FileSystem` object, you can use the following methods:

### `lsDir()`

Returns a list of entries (files and directories) within the specified directory. It is **not recursive** — exactly one level.

```javascript
/**
 * List contents of the directory
 * @returns {Promise<Array<Entry>>} Array of entries in the directory
 */
const allFiles = await filesystem.lsDir();
```

There is **no `ls()`** method and no separate `lsDir()`-for-folders-only variant: `lsDir()` returns files and directories mixed together, and you filter with `entry.isDirectory`. Entries are plain data objects, not handles — to act on one, call `fsOperation(entry.url)`. See [`Entry`](#the-lsdir-entry-shape).

::: warning
`lsDir()` rejects when the URL is not an existing directory. On `file://` URLs the rejection carries a `code` plus a `message` from the table in `src/fileSystem/internalFs.js` — `1` → `"Path not found"`, `11` → `"Type mismatch"`, and `"Uncaught error"` for anything else.
:::

### `readFile(encoding?)`

Reads the contents of a file. Optionally accepts an encoding parameter (`encoding`) for text files.

```javascript
/**
 * Read contents of a file
 * @param {string} [encoding] Encoding for text files. One of "json", "auto", or any charset
 *   name/alias from acode.require("encodings").encodings.
 * @returns {Promise<string | object | ArrayBuffer>} File content
 */
const fileContent = await filesystem.readFile();
```

| Call | Resolves with |
| --- | --- |
| `readFile()` | `ArrayBuffer` of the raw bytes |
| `readFile('utf-8')` / `readFile('utf8')` / `readFile('GBK')` | `string` decoded with that charset |
| `readFile('json')` | the **parsed** object — the text is decoded as UTF-8 and passed through `JSON.parse` |
| `readFile('auto')` | `string`, decoded as **UTF-8** — `"auto"` is rewritten to `"UTF-8"` before the lookup. To honour the user's configured default, pass `acode.require("settings").value.defaultFileEncoding` yourself. |

`readFile('json')` is the single most useful form — it is what the app itself uses to load `plugin.json` (`src/lib/loadPlugins.js`, `src/pages/plugins/plugins.js`).

::: info
On `content://` (SAF) URLs the returned text has a leading UTF-8 BOM stripped before decoding, so a BOM-prefixed file reads cleanly.
:::

### `writeFile(content, encoding?)`

Writes data to a file.

```javascript
/**
 * Write data to a file
 * @param {string | ArrayBuffer | Blob} content Content to write
 * @param {string} [encoding] Charset to encode string content with. Ignored for binary content.
 * @returns {Promise<void>} Promise indicating completion
 */
await filesystem.writeFile('content to write');
```

::: danger `writeFile()` does not create the file
On `file://` URLs the write passes `create = false` to the FileEntry writer, so the target must already exist — otherwise the call rejects. Use `createFile()` (or read → modify → `createFile` for a brand new file) instead.
:::

The `encoding` argument is only consulted when `content` is a `string`; `ArrayBuffer` and `Blob` content is written as raw bytes and the charset is ignored. When no `encoding` is given, a string is handed to the platform writer unchanged (UTF-8 in practice).

### `createFile(name, content)`

Creates a new file with the specified name and content **inside this directory**. Only one path segment is allowed — use `createDirectory()` for each level first (or `acode.require("helpers").createFileStructure(uri, name)` for nested paths).

```javascript
/**
 * Create a new file
 * @param {string} name Name of the new file
 * @param {string | ArrayBuffer | Blob} [content] Content for the new file, defaults to ""
 * @returns {Promise<string>} URL of the created file
 */
const createdFile = await filesystem.createFile('filename.js', 'file content');
```

::: warning Not an overwrite on `file://`
For `file://` URLs `createFile()` performs an **exclusive** create (`exclusive = true`), so it rejects when the file already exists instead of truncating it. Delete first, or call `writeFile()` on the existing file. `content://` behaviour is decided by the native SAF bridge and may differ.
:::

### `createDirectory(name)`

Creates a new directory with the specified name **inside this directory**, and resolves with its URL. Like `createFile()`, one path segment per call — create each parent level first.

```javascript
/**
 * Create a new directory
 * @param {string} name Name of the new directory
 * @returns {Promise<string>} URL of the created directory
 */
const createdDirectory = await filesystem.createDirectory('newDirectory');
```

On `file://` URLs an already existing directory is not an error: the underlying `getDirectory(name, { create: true })` resolves the existing one and its `stat().url` is returned, which makes this a safe "ensure directory exists" call.

### `delete()`

Deletes the file or directory specified by the URL. On `file://` URLs a directory is removed **recursively** (`removeRecursively`), so the whole subtree goes with it.

```javascript
/**
 * Delete a file or directory
 * @returns {Promise<void>} Promise indicating completion
 */
await filesystem.delete();
```

::: danger `delete()` on a directory takes its whole subtree with it
This is a permanent delete with no trash step and no undo. Worse, **there is no way to ask for a shallow delete**: `delete()` takes no arguments at all, `fsOperation()` forwards only the URL to the provider factory (`src/fileSystem/index.js:68`), and the `file://` provider branches to `entry.removeRecursively()` for a directory (`src/fileSystem/internalFs.js:76-80`). So calling `delete()` on a directory removes every kept entry underneath it, no matter what you skipped while walking the tree.

To delete selectively you must **delete the unwanted children first and then only the directories that are genuinely empty** — never `delete()` a directory that still has contents you want. See [Delete a tree, skipping some entries](#common-recipes).
:::

### `copyTo(destination)`

Copies the file or directory into the **destination directory**, keeping the source name, and resolves with the URL of the new entry.

```javascript
/**
 * Copy file or directory into a destination directory
 * @param {string} destination URL of the destination directory
 * @returns {Promise<string>} URL of the copied file or directory
 */
const copiedItem = await filesystem.copyTo('file:///sdcard/AcodeCache/backup');
```

| Provider | Semantics |
| --- | --- |
| `file://` | `dest` must be an existing directory; the entry lands at `dest/<source name>`. Directories are copied recursively by the platform `copyTo`. Rejects with `code: 12` / `"Path already exists"` when `dest/<source name>` already exists — **there is no overwrite flag**. |
| `sftp://` | Same shape (`dest` is a directory). The provider implements the recursion itself by downloading and re-uploading every entry, then deletes the temp file. |
| `content://` | The native SAF bridge also treats `dest` as a directory: it creates a new document named after the source inside `dest` (and, for directories, walks the tree). Rejects with `Unable to copy <url>` if the copy cannot be completed. |
| `ftp://` | **Not supported** — `copyTo()` rejects with `Error("Not supported by FTP.")`. |
| `http(s)://` | No `copyTo` at all; the handle only has `readFile` / `writeFile`. |

::: warning
The argument is always a **string URL**. There is no overload that accepts a `File`/`Directory` handle — call `fsOperation(entry.url).copyTo(target)` instead.
:::

### `moveTo(destination)`

Moves the file or directory into the **destination directory**, keeping the source name, and resolves with the URL of the new entry.

```javascript
/**
 * Move file or directory into a destination directory
 * @param {string} destination URL of the destination directory
 * @returns {Promise<string>} URL of the moved file or directory
 */
const movedItem = await filesystem.moveTo('file:///sdcard/AcodeCache/backup');
```

| Provider | Semantics |
| --- | --- |
| `file://` | `dest` must be an existing directory; uses the platform `moveTo`, which rejects when `dest/<source name>` already exists. |
| `sftp://` / `ftp://` | Only the **pathname** of `dest` is used, and the source basename is appended — the entry keeps its name. |
| `content://` | Delegated to the native SAF bridge. Moving an entry into the directory it already lives in is short-circuited to a no-op that resolves with the original URL (`Url.areSame` check against `Url.dirname(url)`). |
| `http(s)://` | No `moveTo`. |

Same overwrite rule as `copyTo`: on `file://` the destination entry must not already exist.

### `renameTo(newName)`

Renames the file or directory to the specified **new name** and resolves with its new URL. Pass a bare name, not a path — the provider joins it with the current parent directory itself.

```javascript
/**
 * Rename file or directory
 * @param {string} newName New name (basename only)
 * @returns {Promise<string>} URL of the renamed file or directory
 */
const renamedItem = await filesystem.renameTo('newName.js');
```

::: tip
Case-only renames work: on `file://` the provider renames the entry to a temporary UUID first and then to the requested name, because the underlying platform API is case-insensitive.
:::

### `exists()`

Checks if the specified file or directory exists.

```javascript
/**
 * Check if file or directory exists
 * @returns {Promise<boolean>} Indicates if the file or directory exists
 */
const doesExist = await filesystem.exists();
```

This is the one method that reports a missing path as a value instead of a rejection: on `file://` it resolves `false` when the platform returns `NOT_FOUND_ERR` (code `1`), and on `content://` any error is swallowed and turned into `false`.

::: warning
Coerce the result. On `content://` the provider returns the native `stats.exists` field verbatim, so a native response without that field makes `exists()` resolve `undefined` instead of `false`. Write `if (await fs.exists())` — truthy — or `Boolean(await fs.exists())`.
:::

FTP and SFTP are the exception: their `exists()` goes to the network and **can reject** on a connection failure.

### `stat()`

Retrieves information about the file or directory.

```javascript
/**
 * Get information about a file or directory
 * @returns {Promise<Stat>} File or directory information
 */
const fileStats = await filesystem.stat();
```

Unlike `exists()`, `stat()` **rejects** for a missing path — use it when you need the size/mtime, and `exists()` when you only need a boolean. See [`Stat`](#stat-object) for the exact keys, and note that `modifiedDate` is a timestamp in milliseconds (`Date | number` on the synthesised SAF storage root).

## Type Definitions

### `Stat` Object

```javascript
/**
 * @typedef {Object} Stat
 * @property {string} name Name of the file or directory
 * @property {string} url URL of the file or directory
 * @property {boolean} isFile Indicates if it's a file
 * @property {boolean} isDirectory Indicates if it's a directory
 * @property {boolean} isLink Indicates if it's a symbolic link
 * @property {number} size Size of the file in bytes
 * @property {number} modifiedDate Last modified date timestamp
 * @property {boolean} canRead Indicates if the file or directory can be read
 * @property {boolean} canWrite Indicates if the file or directory can be written to
 */
```

Additional keys that individual providers add:

| Key | Type | Where it comes from |
| --- | --- | --- |
| `uri` | `string` | Deprecated getter/setter alias of `url`, defined on every `stat()` result by `helpers.defineDeprecatedProperty` |
| `exists` | `boolean` | Native `sdcard.stats` / SFTP stat. This is what `exists()` returns, so it is present on a *successful* `stat()` |
| `mime` / `type` | `string` | `type` is set to a MIME lookup by the FTP, SFTP and SAF providers, and to `"dir"` for a synthesised SAF storage root; `mime` appears on native SAF entries |
| `linkTarget` | `string` | SFTP only — the link target rewritten as a full `sftp://profile-…` URL |

::: warning Read mtime defensively
`modifiedDate` is a millisecond timestamp, but the SAF storage-root `stat()` builds it with `new Date()`, so normalise with the app's own helper: `acode.require("helpers").getStatMtime(stat)`, which accepts `modifiedDate`, `lastModified` **or** `mtime` and always returns a number or `null`.
:::

### `FileSystem` Object

```javascript
/**
 * @typedef {Object} FileSystem
 * @property {() => Promise<Array<Entry>>} lsDir List directory
 * @property {() => Promise<void>} delete Delete file or directory
 * @property {() => Promise<boolean>} exists Check if file or directory exists
 * @property {() => Promise<Stat>} stat Get file or directory stat
 * @property {(encoding: string) => Promise<FileContent>} readFile Read file
 * @property {(data: FileContent, encoding: string) => Promise<void>} writeFile Write file content
 * @property {(name: string, data: FileContent) => Promise<string>} createFile Create file and return URL of the created file
 * @property {(name: string) => Promise<string>} createDirectory Create directory and return URL of the created directory
 * @property {(dest: string) => Promise<string>} copyTo Copy file or directory to destination
 * @property {(dest: string) => Promise<string>} moveTo Move file or directory to destination
 * @property {(newname: string) => Promise<string>} renameTo Rename file or directory
 * @property {string} localName Path of the local cache copy (FTP and SFTP only)
 * @typedef {string | Blob | ArrayBuffer} FileContent
 */
```

That is the whole surface — there is no `appendFile`, `readdir`, `mkdirp`, `symlink`, `chmod` or `toString`. `localName` is the only extra member, and only the FTP and SFTP providers define it: it is the path of the local cache file the provider downloads to / uploads from, which is handy when you need to hand a remote file to a native API.

### Notes

- This `fs` module is designed for basic file system operations and has no API for creating or resolving symbolic links. `isLink` is `false` for `file://`, `content://` and `ftp://` entries; SFTP reports it truthfully, and the app deliberately does **not** recurse into links when indexing a tree.
- Care should be taken while using methods like `delete()`, as they permanently remove files or directories.
- Every I/O method returns a Promise, allowing for asynchronous file system operations. There are **no synchronous variants**, and `fsOperation()` itself is synchronous.

## The `lsDir()` Entry Shape <Badge type="tip" text="new" />

`lsDir()` resolves with plain objects. The **guaranteed** shape is `name`, `url`, `isFile` and `isDirectory`; everything else depends on the provider:

| Provider | `lsDir()` returns |
| --- | --- |
| `file://` | Exactly `{ name, url, isDirectory, isFile }` — built in `internalFs.createFs` from the FileEntry, URL-decoded, and `name` is `Url.basename(url)`. No `size`, no `modifiedDate`. |
| `content://` | The native SAF `sdcard.listDir` records passed through untouched, so `size`, `modifiedDate`, `mime`/`type`, `isLink`, `exists` … are all present. |
| `ftp://` | Native records with `url` rewritten to the full `ftp://user:pass@host:port/…` URL and `type` set from a MIME lookup of the name. |
| `sftp://` | Native records with `url` rewritten to `sftp://profile-<id>/…`, a `type` MIME lookup, and `linkTarget` for symlinks. |

```js
const entries = await fsOperation(dirUrl).lsDir();

for (const entry of entries) {
  // entry.name / entry.url always exist
  if (entry.isDirectory) {
    await fsOperation(entry.url).lsDir(); // recurse yourself
  } else {
    const stat = await fsOperation(entry.url).stat(); // for size / mtime
  }
}
```

::: warning
On `file://` URLs an entry has **no** `size` or `modifiedDate`. Call `stat()` per entry when you need them — that is exactly what the app's own indexer does.
:::

## Supported URL Schemes <Badge type="tip" text="new" />

`fsOperation()` picks the first registered provider whose `test(url)` returns `true`. Registration order in `src/fileSystem/index.js` is SFTP → FTP → `file:` → `content:` → `http(s):`, so:

| Scheme | Example | Provider |
| --- | --- | --- |
| `sftp:` | `sftp://profile-6f1c…/var/www/` | `Sftp.fromUrl`. The host **must** be a native profile id (`profile-…`); a legacy URL with `username`/`password`/`keyFile`/`passPhrase` query credentials throws `"Legacy SFTP credentials must be migrated to a native profile"`. |
| `ftp:` | `ftp://user:pass@host/pub/?security=explicit&mode=active` | `Ftp.fromUrl`; `security` and `mode` come from the query string. |
| `file:` | `file:///sdcard/Acode/test.txt`, `file:///data/user/0/com.foxdebug.acode/files/plugins/<id>/main.js` | `internalFs` — the FileEntry API plus the native `sdcard.stats` bridge. |
| `content:` | `content://com.android.externalstorage.documents/tree/primary%3ADownload%2Ftest.txt` | `externalFs` — Android SAF, via `sdcard.formatUri()` and friends. |
| `http:` / `https:` | `https://example.com/plugin.json` | Read-only HTTP provider using `ajax.get`/`ajax.post` with `responseType: "arraybuffer"`. Only `readFile(encoding?)` and `writeFile(content)` exist. |
| anything else | `myapp://x` | **`undefined`** — `fsOperation()` returns `undefined` and every property access on it throws `TypeError`. |

Notes on the two local schemes:

- `file://` covers **both** app-internal storage (`file:///data/user/0/com.foxdebug.acode/files/…`, where plugins live) and `/sdcard`. There is no separate "internal" scheme.
- `content://` URLs contain a `primary:`-style document id that must stay percent-encoded when you build them. Use `acode.joinUrl(...)` / [`Url.join()`](./url.md) instead of string concatenation — it understands the `rootUri::root:path` shape and the `?query` suffix.
- On Android 11+ a `content://` tree that the user has not granted yet needs a storage permission prompt first (`sdcard.getStorageAccessPermission`); the app shows a loader while the user picks the folder.

## Encoding Support <Badge type="tip" text="new" />

The `encoding` argument of `readFile()` / `writeFile()` is the *same* charset vocabulary as [`acode.require("encodings")`](./encoding.md):

| Value | Meaning |
| --- | --- |
| omitted | Binary mode. `readFile()` gives an `ArrayBuffer`; `writeFile()` writes a string unchanged (UTF-8 in practice). |
| `"json"` | Read: decode as UTF-8 and `JSON.parse`. Write: a `"json"` encoding is resolved to UTF-8, so the value is written as text — stringify it yourself. |
| `"auto"` | Rewritten to `"UTF-8"` before the lookup, **not** to the user's default encoding. |
| any charset name or alias | e.g. `"utf-8"`, `"utf8"`, `"GBK"`, `"windows-1252"`, `"ISO-8859-1"`. |

Four rules that are easy to get wrong:

1. **Lookup is case-insensitive and alias-aware.** `getEncoding()` lowercases the requested string and compares it against every charset name *and* every alias, so `"utf-8"`, `"UTF-8"` and `"utf8"` all resolve to the same encoder.
2. **Unknown charsets do not throw — they silently become UTF-8.** `getEncoding()` returns `encodings["UTF-8"]` when nothing matches, so a typo such as `"utf16"` decodes as UTF-8 instead of erroring. Validate against `encodings.encodings` if the charset came from user input.
3. **Only string content is encoded.** `writeFile(buffer, "gbk")` writes the bytes untouched — the `encoding` argument is only read when `typeof content === "string"`.
4. **`defaultFileEncoding` is not consulted here.** It is only used when a charset argument is *falsy*, and `fs` skips the whole decode/encode path when `encoding` is falsy. To respect the user's setting, pass it explicitly: `fs(url).readFile(acode.require("settings").value.defaultFileEncoding)`.

## Registering Your Own Provider <Badge type="tip" text="new" />

The function you get from `acode.require("fs")` carries two static helpers, so a plugin can add a storage backend for a scheme of its own:

```js
const fs = acode.require("fs");

const test = (url) => /^myscheme:/.test(url);

fs.extend(test, (url) => ({
  lsDir: async () => [/* { name, url, isFile, isDirectory } */],
  readFile: async (encoding) => new ArrayBuffer(0),
  writeFile: async (content, encoding) => {},
  exists: async () => true,
  stat: async () => ({ name: "x", url, isFile: true, isDirectory: false, size: 0, modifiedDate: Date.now() }),
  delete: async () => {},
}));

// Later, during unmount:
fs.remove(test); // identity-compared against the same test function
```

| Member | Signature | Behaviour |
| --- | --- | --- |
| `extend` | `(test: (url: string) => boolean, fs: (url: string) => FileSystem) => void` | Pushes `{ test, fs }` on the provider list. Registration is searched in order, and built-ins are registered first, so a plugin **cannot** shadow a built-in scheme — it must use a new one. Every open editor file whose `uri` the new `test` matches and that has a tab but has not loaded yet is loaded automatically. |
| `remove` | `(test: (url: string) => boolean) => void` | Removes the first provider whose `test` is the **identical function reference**. Keep a reference to the exact function you passed to `extend`. |

`fsOperation.hasProvider(url)` is not exposed to plugins — `acode.require("fs")` gives you only the callable plus `extend` / `remove`.

## Complete Example: read → modify → write <Badge type="tip" text="new" />

```js
const fs = acode.require("fs");
const Url = acode.require("Url");

async function appendLine(line) {
  const dirUrl = await fs(CACHE_STORAGE).createDirectory("my-plugin");
  const fileUrl = Url.join(dirUrl, "notes.md");

  try {
    // 1. createDirectory() above is idempotent on file:// URLs, so the
    //    directory is guaranteed to exist here.
    const exists = await fs(fileUrl).exists();
    let text = "";

    // 2. Read as text. Call with no argument to get an ArrayBuffer instead.
    if (exists) {
      text = await fs(fileUrl).readFile("utf-8");
      if (typeof text !== "string") {
        text = new TextDecoder().decode(text);
      }
    }

    // 3. Modify.
    const prefix = text && !text.endsWith("\n") ? "\n" : "";
    const next = `${text}${prefix}- ${line}\n`;

    if (exists) {
      // 4a. writeFile() does not create, so it is the right call for an
      //     existing file.
      await fs(fileUrl).writeFile(next, "utf-8");
    } else {
      // 4b. createFile() is exclusive on file:// URLs — safe here because
      //     we just proved the file does not exist.
      await fs(dirUrl).createFile("notes.md", next);
    }

    acode.toast("Saved", 1500);
    return fileUrl;
  } catch (error) {
    // Platform errors carry .code (1 = "Path not found", 12 = "Path already
    // exists", ...) plus a human readable .message.
    acode.toast(`Save failed: ${error?.message || error}`, 3000);
    console.error("appendLine failed", error);
    return null;
  }
}

acode.setPluginInit(plugin.id, () => {
  appendLine("hello from the plugin");
});
```

## Common Recipes <Badge type="tip" text="new" />

::: code-group

```js [Read a file as text]
const fs = acode.require("fs");
const fileUrl = "file:///sdcard/Acode/notes.md";

if (await fs(fileUrl).exists()) {
  const text = await fs(fileUrl).readFile("utf-8");
  console.log(text.slice(0, 100));
}
```

```js [Read as base64 / data URL]
const fs = acode.require("fs");

// No encoding -> ArrayBuffer of the raw bytes.
const buffer = await fs("file:///sdcard/Acode/logo.png").readFile();

const bytes = new Uint8Array(buffer);
let binary = "";
for (let i = 0; i < bytes.length; i += 0x8000) {
  binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
}
const base64 = btoa(binary);
const dataUrl = `data:image/png;base64,${base64}`;
```

```js [Write text and binary]
const fs = acode.require("fs");
const fileUrl = "file:///sdcard/Acode/notes.md";

// Text: pick the charset explicitly. The file must already exist.
await fs(fileUrl).writeFile("héllo", "utf-8");

// Binary: pass the bytes, no encoding argument.
await fs(fileUrl).writeFile(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
```

```js [Ensure a nested directory exists]
const fs = acode.require("fs");
const helpers = acode.require("helpers");

// One segment per call.
let url = "file:///sdcard/AcodeCache";
for (const segment of ["my-plugin", "templates", "html"]) {
  url = await fs(url).createDirectory(segment);
}

// Or let the app walk and create every missing level for you.
const result = await helpers.createFileStructure(
  CACHE_STORAGE,
  "my-plugin/templates/html/index.html",
);
result.uri;      // URL of the FIRST entry it had to create (…/my-plugin here)
result.type;     // "file" or "folder"
result.created;  // false when everything already existed
```

```js [Walk a tree recursively]
const fs = acode.require("fs");
const Url = acode.require("Url");

async function* walk(dirUrl) {
  const entries = await fs(dirUrl).lsDir();
  for (const entry of entries) {
    yield entry;
    if (entry.isDirectory) yield* walk(entry.url);
  }
}

for await (const entry of walk("file:///sdcard/Acode")) {
  console.log(entry.isDirectory ? "[dir] " : "      ", Url.basename(entry.url));
}
```

```js [Delete a tree, skipping some entries]
const fs = acode.require("fs");

// Returns true when `dirUrl` and everything under it is gone,
// false when a kept entry survived and `dirUrl` had to stay.
async function deleteTree(dirUrl, keep = new Set()) {
  let keptSomething = false;

  for (const entry of await fs(dirUrl).lsDir()) {
    // A kept name is left completely alone, subtree included.
    if (keep.has(entry.name)) {
      keptSomething = true;
      continue;
    }

    if (entry.isDirectory) {
      // A subdirectory that still holds a kept entry must survive, and so
      // must this one. `delete()` is recursive on file://, so we may only
      // call it on a directory we know is empty.
      if (!(await deleteTree(entry.url, keep))) {
        keptSomething = true;
        continue;
      }
    }

    await fs(entry.url).delete();
  }

  if (!keptSomething) await fs(dirUrl).delete();
  return !keptSomething;
}

// "cache" survives (at any depth); everything else under my-plugin is removed,
// and my-plugin itself stays because "cache" is still inside it.
await deleteTree(`${CACHE_STORAGE}/my-plugin`, new Set(["cache"]));

// With an empty `keep` the whole tree, including the root, is deleted.
await deleteTree(`${CACHE_STORAGE}/stale-cache`);
```

```js [Duplicate before editing]
const fs = acode.require("fs");
const fileUrl = "file:///sdcard/Acode/notes.md";

// copyTo() takes the destination DIRECTORY and keeps the source name.
const backupDir = await fs(CACHE_STORAGE).createDirectory("backup");
await fs(fileUrl).copyTo(backupDir); // -> backupDir/notes.md
```
:::

## Gotchas <Badge type="tip" text="new" />

Grounded in `src/fileSystem/*.js`:

1. **`fsOperation()` is synchronous and never validates.** `const filesystem = fs(url)` — no `await`, and the JSDoc return type is `FileSystem`, not `Promise<FileSystem>`. For a missing path you still get a handle; the error appears on the first method call.
2. **`exists()` is the only non-throwing probe**, and on `content://` it resolves whatever `stat().exists` contains — possibly `undefined`. Coerce with `Boolean(...)`.
3. **`stat()` rejects on a missing path** — it is not a safe existence check. Wrap it in `try/catch` or check `exists()` first.
4. **`copyTo()` / `moveTo()` take a directory URL and do not overwrite.** On `file://` an existing target rejects with `code: 12` (`"Path already exists"`). Delete or rename the destination first, and note that `ftp://` has no `copyTo` at all.
5. **`renameTo()` takes a bare name.** Passing a path such as `"sub/newName.txt"` produces a file literally called `sub/newName.txt` on `file://` URLs.
6. **`writeFile()` cannot create, `createFile()` cannot overwrite** (on `file://`). Pick one based on whether the file is already there.
7. **`createDirectory()` / `createFile()` create exactly one level.** `createFile("a/b.txt", …)` fails because `a` does not exist — use `acode.require("helpers").createFileStructure()` for nested paths.
8. **Every I/O method is async and can reject; there are no sync variants.** `exists()` is the sole exception that reports failure as a value (FTP/SFTP still reject on network errors).
9. **Charset names are case-insensitive and alias-aware, and unknown ones silently fall back to UTF-8.** They do not throw, so a typo is a silent mis-decode rather than an error. See [Encoding](./encoding.md).
10. **`delete()` on a directory is recursive** on `file://` (`removeRecursively`) and on `sftp://` (the recursive flag is passed to `sftp.rm`). It takes **no arguments on any provider**, so there is no `delete(recursive: false)`, no `rmdir`-only variant and no children filter.
11. **Encoding arguments are ignored for binary content** — `writeFile(buffer, "gbk")` writes the buffer unchanged.
12. **`localName` only exists on FTP and SFTP handles.** `fs(url).localName` is `undefined` for `file://`, `content://` and `http(s)://`, so feature-detect it.
13. **An unknown scheme yields `undefined`, not an error.** `fs('myapp://x').exists()` throws `TypeError: Cannot read properties of undefined`. Check the handle before use.

