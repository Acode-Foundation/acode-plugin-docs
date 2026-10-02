# File Index API <Badge type="tip" text="preferred over fileList" />

The File Index API is the preferred way to list and search files in large local workspaces. It moves indexing for SAF (`content:`) and `file://` roots into a native Android SQLite index so the WebView no longer builds a full in-memory file tree.

::: info
Present in the Acode **v1.13.5** source tree (`src/lib/fileIndex.js`). `CHANGELOG.md` does not record a `versionCode` for this API, so do not hardcode one — detect it at runtime with `acode.require("fileIndex")?.query` or `fileIndex.supports(url)`.
:::

## Why use `fileIndex`?

| | `fileList` (legacy) | `fileIndex` (new) |
| --- | --- | --- |
| SAF / `file://` | No longer fully listed | Native SQLite index |
| FTP / SFTP / custom | Still works | Not supported — use `fileList` |
| API style | Sync tree objects | Async flat records |
| Large workspaces | Heavy WebView tree | Paginated native queries |
| Search | App-side workers | Native streaming search (`fileIndex.search`) |

`acode.require("fileList")` is **deprecated**. It now contains files from **non-native providers only**. Plugins that need SAF or `file://` files must migrate to `fileIndex`.

## Import

```js
const fileIndex = acode.require("fileIndex");
```

`acode.require()` lowercases the module name, so `"fileIndex"` and `"fileindex"` both resolve to the same object.

Feature detection:

```js
const fileIndex = acode.require("fileIndex");
if (!fileIndex?.query) {
  // Running on an older Acode build — use fileList fallback
}
```

## Async behaviour <Badge type="tip" text="new" />

Every data-returning member of `fileIndex` is **Promise-based**, because it calls into the native `sdcard` plugin:

| Member | Returns | Rejects when |
| --- | --- | --- |
| `query(options?)` | `Promise<{entries, cursor, hasMore}>` | Native index unavailable (`"Native file index is unavailable"`) |
| `get(url)` | `Promise<Entry \| null>` | Same as `query` |
| `scan(root, options?)` | `Promise & {id, cancel}` | `supports(rootUrl)` is false, or a `error` event arrives |
| `update(root, changes?)` | `Promise<{added, removed}>` | `supports(rootUrl)` is false |
| `markDirty(urls)` | `Promise` | Native index unavailable |
| `clear(roots?)` | `Promise` | Native index unavailable |
| `whenReady(roots?)` | `Promise` (never rejects) | Never — it uses `Promise.allSettled` |

`search()` is the exception: it is **synchronous** and returns a handle `{id, result, cancel}` where `result` is the Promise. If the native search is unavailable it still returns a handle, but with `id: ""` and an already-**rejected** `result`.

```js
const job = fileIndex.scan("file:///sdcard/Project");
job.id;      // "scan-1730000000000-abc123"
await job;   // resolves with the terminal "done" event
```

::: warning `result` / returned promises can reject before you attach a handler
`search()` builds its `result` promise eagerly. If the native search is missing, `result` is rejected immediately — attach a `.catch()` in the same tick or you will get an unhandled rejection.
:::

## Providers <Badge type="tip" text="new" />

`fileIndex` only ever serves URLs that pass `supports()` — that is, `file:` and `content:` URLs **and** a native plugin that exposes `sdcard.workspaceScan`. Everything else (FTP, SFTP, custom storage plugins) is still indexed in JavaScript and is only visible through the deprecated [`fileList`](./file-list.md).

There is no separate "provider registration" call. Storage plugins register themselves as a **workspace folder**, and Acode routes that folder to one of the two indexers:

```js
const openFolder = acode.require("openfolder");

openFolder("ftp://example.com/www", {
  name: "My FTP site", // required, used as the index title
  listFiles: true,     // opt into file indexing
});
```

`openFolder()` pushes a folder descriptor onto `acode.require("addedfolder")`:

| Property | Type | Description |
| --- | --- | --- |
| `url` | `string` | Folder URL |
| `title` | `string` | Display name (also the native index `title`) |
| `listFiles` | `boolean` | Whether Acode indexes this folder at all. Defaults to `appSettings.value.fileBrowser.listFiles` (`true`) |
| `id` | `string` | Optional folder id |
| `saveState` | `boolean` | Persist expand/collapse state |
| `listState` | `Map<string, boolean>` | Restored expand/collapse state |
| `remove()` | `() => void` | Remove the folder from the sidebar |
| `reload()` | `() => void` | Collapse and re-expand the sidebar node |

Because the folder descriptor exposes `title` (not `name`), read it correctly:

```js
const fileIndex = acode.require("fileIndex");

const roots = acode
  .require("addedfolder")
  .filter((folder) => folder.listFiles && fileIndex.supports(folder.url))
  .map((folder) => folder.url);
```

Internally, `fileList.addRoot({url, name})` makes the routing decision: `fileIndex.supports(url)` → native scan plus an `add-folder` event of `{url, name, native: true}`; otherwise a `Tree` root is created and walked with `fsOperation(url).lsDir()`. That is the exact boundary between the two APIs.

## Compatibility

| Provider | Index / query | Content search |
| --- | --- | --- |
| SAF (`content:`) | Native | Native |
| `file://` | Native | Native |
| FTP / SFTP | Not supported | JavaScript fallback elsewhere |
| Custom storage plugins | Not supported | JavaScript fallback elsewhere |

Check support before scanning:

```js
if (fileIndex.supports(workspaceUrl)) {
  await fileIndex.scan(workspaceUrl);
}
```

## Quick start

```js
const fileIndex = acode.require("fileIndex");
const addedFolder = acode.require("addedfolder");

const roots = addedFolder
  .filter((folder) => folder.listFiles && fileIndex.supports(folder.url))
  .map((folder) => folder.url);

const { entries, hasMore, cursor } = await fileIndex.query({
  roots,
  text: "filename",
  limit: 200,
});

for (const file of entries) {
  console.log(file.name, file.path, file.url);
}
```

## Methods

These are the **only** eleven members on the module object (`src/lib/fileIndex.js`):

| Member | Signature |
| --- | --- |
| `supports` | `supports(url = "") => boolean` |
| `scan` | `scan(root: string \| {url, name?, title?}, options = {}) => Promise & {id, cancel}` |
| `update` | `update(root: string \| object, changes = {}) => Promise<{added, removed}>` |
| `query` | `query(options = {}) => Promise<{entries, cursor, hasMore}>` |
| `search` | `search(options, onEvent = () => {}) => {id, result, cancel}` |
| `get` | `get(url: string) => Promise<Entry \| null>` |
| `markDirty` | `markDirty(urls: string[]) => Promise` |
| `clear` | `clear(roots = []) => Promise` |
| `whenReady` | `whenReady(roots?: string[]) => Promise` |
| `subscribe` | `subscribe(listener: (event) => void) => () => boolean` |
| `cancel` | `cancel(id: string) => Promise` |

### `supports(url?: string): boolean`

Returns `true` when the URL can be indexed natively (`file:` or `content:` **and** the native plugin exposes `sdcard.workspaceScan`). The argument defaults to `""`, which always returns `false`.

```js
fileIndex.supports("file:///sdcard/MyProject"); // true on supported builds
fileIndex.supports("content://com.android.externalstorage.documents/tree/primary%3ADownload"); // true
fileIndex.supports("ftp://example.com/www"); // false
```

### `query(options?): Promise<FileIndexQueryResult>`

Query indexed entries. Results are **flat metadata records**, not `Tree` objects, and support **offset pagination**.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `roots` | `string[]` | `[]` | Limit to these workspace roots. Empty = all indexed roots |
| `text` | `string` | `""` | Case-insensitive substring match on `name` **or** `path` (`LIKE '%text%'`) |
| `url` | `string` | `""` | Exact URL lookup |
| `includeDirectories` | `boolean` | `false` | Include folders |
| `limit` | `number` | `200` | Page size. Clamped to `1 … 1000` by the native layer |
| `cursor` | `number` | `0` | Row offset. `offset` is accepted as an alias. Clamped to `>= 0` |

Result shape:

| Field | Type | Description |
| --- | --- | --- |
| `entries` | `Entry[]` | Flat entry records for this page |
| `cursor` | `number \| null` | Next offset, or `null` when there is nothing left |
| `hasMore` | `boolean` | Whether more rows exist past this page |

::: tip Ordering
With `text`, results whose **name starts with** the query rank first, then case-insensitive `name`, then `path`. Without `text`, ordering is simply case-insensitive `name`, then `path`.
:::

```js
let cursor = 0;
const all = [];

while (true) {
  const page = await fileIndex.query({
    roots: [workspaceUrl],
    text: "util",
    limit: 100,
    cursor,
  });
  all.push(...page.entries);
  if (!page.hasMore) break;
  cursor = page.cursor;
}
```

### `get(url: string): Promise<FileIndexEntry | null>`

Fetch a single indexed entry by exact URL. It is a thin wrapper over `query({url, includeDirectories: true, limit: 1})` and returns `entries[0]`, or `null` when nothing matches.

```js
const entry = await fileIndex.get(fileUrl);
```

### `scan(root, options?): Promise & { id, cancel }`

Fully scan a SAF or `file://` workspace into the native index. Acode already scans open folders; plugins usually only need this for custom roots.

```js
const job = fileIndex.scan(
  { url: rootUrl, name: "My Project" },
  { indexContent: false },
);

// Optional: cancel an in-flight scan
// await job.cancel();

const done = await job;
console.log(done.files, done.dirs);
```

| Option | Type | Description |
| --- | --- | --- |
| `title` / `name` | `string` | Display title for the workspace. **Only read when `root` is a string** — with an object root the title comes from `root.name \|\| root.title` |
| `excludeFolders` | `string[]` | Exclude glob patterns. Defaults to `settings.value.excludeFolders` |
| `showHiddenFiles` | `boolean` | Include hidden files. Defaults to `settings.value.fileBrowser.showHiddenFiles` |
| `defaultEncoding` | `string` | Encoding for optional content indexing. Defaults to `settings.value.defaultFileEncoding` |
| `indexContent` | `boolean` | Also cache file text so `search({useIndex: true})` can reuse it. Defaults to `false` |

::: warning
- The promise **rejects** with `Native file index does not support: <url>` when `supports(rootUrl)` is false.
- Calling `scan()` for a root that is already scanning **cancels the previous scan first**.
- `fileIndex` hardcodes `emitEntries: false`, so `scan` never emits `batch` events — use `subscribe` for progress instead.
- The promise resolves on both `done` and `cancelled`; only `error` (and native failure) rejects.
:::

### `update(root, changes?): Promise<{ added, removed }>`

Incrementally add or remove paths without a full rescan. Resolves with the **number** of rows added and removed.

```js
await fileIndex.update(rootUrl, {
  added: [{ url: newFileUrl, parentUrl: parentDirUrl }],
  removed: [deletedFileUrl],
});
```

`changes` also accepts `title` / `name` (string `root` only), `excludeFolders`, `showHiddenFiles` and `defaultEncoding`, with the same app-setting defaults as `scan`. It rejects for unsupported roots.

### `search(options, onEvent?): { id, result, cancel }`

Start a native streaming search or replace. This call is **synchronous** — it returns a handle, not a Promise.

The JS layer reads only `id`, `roots`, `files`, `overlays`, `batchResults` and `defaultEncoding`; everything else below is forwarded verbatim to the native search.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | generated | Use your own job id (must be unique) |
| `roots` | `string[]` | `[]` | Workspace roots to pull indexed files from |
| `files` | `object[]` | `[]` | Explicit file list (serialised with the native `FileEntry` shape), merged with indexed root files |
| `search` | `string` | `""` | Pattern / text to find |
| `replace` | `string` | | Replacement text when `mode` is `"replace"` |
| `mode` | `"search" \| "replace"` | `"search"` | Operation mode |
| `options.regExp` | `boolean` | `false` | Treat `search` as a regular expression |
| `options.wholeWord` | `boolean` | `false` | Whole-word matching |
| `options.caseSensitive` | `boolean` | `false` | Case-sensitive matching |
| `options.include` | `string` | | Comma-separated inclusion globs (defaults to `**`) |
| `options.exclude` | `string` | | Comma-separated exclusion globs |
| `overlays` | `Record<url, string>` | `{}` | In-memory content, e.g. open dirty editors, keyed by URL |
| `batchResults` | `boolean` | `true` | Emit `search-results` (array) instead of `search-result` (single) |
| `useIndex` | `boolean` | `false` | Read cached file contents instead of hitting storage |
| `defaultEncoding` | `string` | `settings.value.defaultFileEncoding` | Encoding for disk reads |

```js
const { id, result, cancel } = fileIndex.search(
  {
    roots: [workspaceUrl],
    search: "TODO",
    options: { caseSensitive: false },
    batchResults: true,
  },
  (event) => {
    switch (event.type) {
      case "search-results":
        for (const item of event.data) {
          console.log(item.file.url, item.matches.length, item.limited);
        }
        break;
      case "progress":
        console.log(`${event.data}%`);
        break;
      case "error":
        console.error(event.error);
        break;
    }
  },
);

await result; // resolves on done-searching / done-replacing
// await cancel();
```

Each match payload is `{file: Entry, matches: Match[], limited: boolean}`, where `limited` tells you the file's match list was truncated.

::: tip Batched vs single events
`fileIndex.search` defaults `batchResults` to **`true`**, so you usually handle `search-results` and iterate `event.data`. Each such event carries an **array of per-file match objects** — one entry per file that matched in that batch.

If you call the low-level `sdcard.workspaceSearch()` yourself, `batchResults` defaults to **`false`**, so you get single `search-result` events whose `data` is one match object, unless you pass `batchResults: true`.
:::

### `markDirty(urls: string[]): Promise`

Invalidate cached file contents after an editor save or external change, so the next `useIndex` search re-reads from storage.

```js
await fileIndex.markDirty([fileUrl]);
```

### `clear(roots?: string[]): Promise`

Remove native indexes. Any scan still running for one of those roots is cancelled first.

```js
await fileIndex.clear([rootUrl]);
```

::: danger
`clear()` with an empty array (or no argument) wipes **every** indexed workspace, cached content included. Always pass explicit roots unless you really mean "reset the whole index".
:::

### `whenReady(roots?: string[]): Promise`

Wait until in-flight scans finish. It resolves with `Promise.allSettled()` results, so it **never rejects** — inspect the settled entries if you care about failures.

Only scans started through `fileIndex.scan()` are tracked here; it does not wait for the JavaScript fallback scans used by remote providers.

```js
await fileIndex.whenReady(roots);
const { entries } = await fileIndex.query({ roots, text: query });
```

### `subscribe(listener): () => boolean`

Listen for scan and search events. Returns an unsubscribe function (whose return value is `Set.delete()`'s boolean, which you can ignore).

```js
const stop = fileIndex.subscribe((event) => {
  if (event.type === "status") {
    console.log(event.state, event.message, event.progress);
  }
});

// later
stop();
```

### `cancel(id: string): Promise`

Cancel a scan or search job by id. A falsy id resolves immediately without touching the native layer.

```js
await fileIndex.cancel(job.id);
```

## Entry shape

Query results use flat records (not nested `Tree` objects). This is the native `WorkspaceFileEntry` shape:

| Field | Type | Description |
| --- | --- | --- |
| `rootUrl` | `string` | Workspace root URL this entry belongs to |
| `parent` / `parentUrl` | `string` | Parent directory URL (both fields hold the same value) |
| `name` | `string` | File or folder name |
| `path` | `string` | Path relative to the workspace root, prefixed with the workspace title |
| `url` / `uri` | `string` | Absolute URL (both fields hold the same value) |
| `mime` / `type` | `string \| null` | MIME type when known (both fields hold the same value) |
| `isDirectory` | `boolean` | Directory flag |
| `isFile` | `boolean` | Inverse of `isDirectory` |
| `size` | `number` | Size in bytes |
| `modifiedDate` | `number` | Last modified timestamp in ms, `>= 0` |

```js
const { entries } = await fileIndex.query({ roots: [workspaceUrl], limit: 5 });
// {
//   rootUrl: "file:///sdcard/Project",
//   parent: "file:///sdcard/Project/src",
//   parentUrl: "file:///sdcard/Project/src",
//   url: "file:///sdcard/Project/src/app.js",
//   uri: "file:///sdcard/Project/src/app.js",
//   name: "app.js",
//   path: "Project/src/app.js",
//   mime: "application/javascript",
//   type: "application/javascript",
//   isDirectory: false,
//   isFile: true,
//   size: 2048,
//   modifiedDate: 1730000000000
// }
```

## Migrating from `fileList`

### Before (deprecated)

```js
const fileList = acode.require("fileList");

// Leaves of non-native provider trees as Tree objects
const files = fileList();

// Synchronous, but logs a one-time console.warn on the first call
fileList.on("add-file", (file) => {
  console.log(file.path);
});
```

### After

```js
const fileIndex = acode.require("fileIndex");
const addedFolder = acode.require("addedfolder");

const roots = addedFolder
  .filter((f) => f.listFiles && fileIndex.supports(f.url))
  .map((f) => f.url);

await fileIndex.whenReady(roots);

const { entries } = await fileIndex.query({
  roots,
  text: "",
  limit: 200,
});
```

Key differences:

1. **`fileIndex` is asynchronous** — always `await` queries and scans.
2. **Results are flat records** — no `children` / `parent` tree navigation.
3. **Pagination** — use `cursor` / `hasMore` for large result sets.
4. **`fileList` is empty for SAF and `file://`** — keep it only for FTP/SFTP if needed.
5. **Search events may be batched** — handle `search-results` as well as `search-result`.

Hybrid pattern (native roots + remote fallback), mirroring Acode's own Find File palette:

```js
const fileIndex = acode.require("fileIndex");
const fileList = acode.require("fileList"); // legacy, remote providers only
const addedFolder = acode.require("addedfolder");

const nativeRoots = [];
for (const folder of addedFolder) {
  if (!folder.listFiles) continue;
  if (fileIndex.supports(folder.url)) {
    nativeRoots.push(folder.url);
  }
}

let entries = [];
if (nativeRoots.length) {
  try {
    ({ entries = [] } = await fileIndex.query({
      roots: nativeRoots,
      text: query,
      limit: 300,
    }));
  } catch (error) {
    console.warn("Unable to query native file index:", error);
  }
}

// Non-native providers still appear in the legacy list
const remoteFiles = fileList();
```

## Events <Badge type="tip" text="corrected" />

`scan()` and `search()` share one event envelope: `{id, type, action}` where `action` always mirrors `type`, so read either. `fileIndex` switches on `event.type || event.action`.

| Type | Extra payload | Emitted by |
| --- | --- | --- |
| `status` | `state`, `message`, `progress` | `scan` (and native search) |
| `progress` | `data` (0–100) | Search |
| `batch` | `entries: Entry[]` | **Not** via `fileIndex.scan` — it forces `emitEntries: false` |
| `search-result` | `data: {file, matches, limited}` | Search with `batchResults: false` |
| `search-results` | `data: Array<{file, matches, limited}>` | Search with `batchResults: true` (the default) |
| `replace-result` | `file: Entry`, `text: string` | Search with `mode: "replace"` |
| `done` | `files`, `dirs`, `indexed` | `scan` — also resolves the scan promise |
| `cancelled` | — | `scan` — also resolves the scan promise |
| `done-searching` / `done-replacing` | — | Search — also resolves `result` |
| `error` | `error` (message string) | Scan and search — also rejects |

Every event from `scan()` is forwarded to `subscribe()` listeners, so you can watch index progress without owning the scan:

```js
const stop = fileIndex.subscribe((event) => {
  if (event.type === "status") {
    console.log(event.state, event.message);
  }
  if (event.type === "done") {
    console.log("indexed", event.files, "files and", event.dirs, "folders");
  }
});

acode.require("openfolder")("file:///sdcard/Project", {
  name: "Project",
  listFiles: true,
});
```
