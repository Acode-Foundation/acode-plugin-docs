# File Index API <Badge type="tip" text="v1002+" />

The File Index API is the preferred way to list and search files in large local workspaces. It moves indexing for SAF (`content:`) and `file://` roots into a native Android SQLite index so the WebView no longer builds a full in-memory file tree.

::: info
Available from **versionCode `1002`**. Set `"minVersionCode": 1002` in `plugin.json` when your plugin depends on it.
:::

## Why use `fileIndex`?

| | `fileList` (legacy) | `fileIndex` (new) |
| --- | --- | --- |
| SAF / `file://` | No longer fully listed | Native SQLite index |
| FTP / SFTP / custom | Still works | Not supported — use `fileList` |
| API style | Sync tree objects | Async flat records |
| Large workspaces | Heavy WebView tree | Paginated native queries |
| Search | App-side workers | Optional native streaming search |

`acode.require("fileList")` is **deprecated**. It now contains files from **non-native providers only**. Plugins that need SAF or `file://` files must migrate to `fileIndex`.

## Import

```js
const fileIndex = acode.require("fileIndex");
```

Feature detection:

```js
const fileIndex = acode.require("fileIndex");
if (!fileIndex?.query) {
  // Running on an older Acode build — use fileList fallback
}
```

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

### `supports(url?: string): boolean`

Returns `true` when the URL can be indexed natively (`file:` or `content:` and the native plugin is available).

```js
fileIndex.supports("file:///sdcard/MyProject"); // true on supported builds
fileIndex.supports("ftp://example.com/www"); // false
```

### `query(options?): Promise<FileIndexQueryResult>`

Query indexed entries. Results are **flat metadata records**, not `Tree` objects, and support **cursor pagination**.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `roots` | `string[]` | `[]` | Limit to these workspace roots. Empty = all indexed roots |
| `text` | `string` | `""` | Case-insensitive match on `name` and `path` |
| `url` | `string` | `""` | Exact URL lookup |
| `includeDirectories` | `boolean` | `false` | Include folders |
| `limit` | `number` | `200` | Page size (capped at `1000`) |
| `cursor` | `number` | `0` | Offset from a previous page |

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

Fetch a single indexed entry by exact URL (includes directories).

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
| `title` / `name` | `string` | Display title for the workspace |
| `excludeFolders` | `string[]` | Glob-like exclude patterns (defaults to app settings) |
| `showHiddenFiles` | `boolean` | Include hidden files |
| `defaultEncoding` | `string` | Encoding for optional content indexing |
| `indexContent` | `boolean` | Also cache file text for faster search |

### `update(root, changes?): Promise<{ added, removed }>`

Incrementally add or remove paths without a full rescan.

```js
await fileIndex.update(rootUrl, {
  added: [{ url: newFileUrl, parentUrl: parentDirUrl }],
  removed: [deletedFileUrl],
});
```

### `search(options, onEvent?): { id, result, cancel }`

Start a native streaming search or replace.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `roots` | `string[]` | `[]` | Workspace roots to search from the index |
| `files` | `object[]` | `[]` | Explicit file list (merged with indexed root files) |
| `search` | `string` | | Pattern / text to find |
| `replace` | `string` | | Replacement text when `mode` is `"replace"` |
| `mode` | `"search" \| "replace"` | `"search"` | Operation mode |
| `options.regExp` | `boolean` | `false` | Treat `search` as a regular expression |
| `options.wholeWord` | `boolean` | `false` | Whole-word matching |
| `options.caseSensitive` | `boolean` | `false` | Case-sensitive matching |
| `options.include` | `string` | | Include globs |
| `options.exclude` | `string` | | Exclude globs |
| `overlays` | `Record<string, string>` | `{}` | In-memory content (e.g. open dirty editors) |
| `batchResults` | `boolean` | `true` | Emit batched `search-results` events |
| `useIndex` | `boolean` | `false` | Prefer cached file contents when available |
| `defaultEncoding` | `string` | app setting | Encoding for disk reads |

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
          console.log(item.file.url, item.matches.length);
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

::: tip Batched vs single events
`fileIndex.search` defaults `batchResults` to **`true`**, so you usually handle `search-results` (array).

The low-level `sdcard.workspaceSearch()` keeps **single** `search-result` events unless you pass `batchResults: true`.
:::

### `markDirty(urls: string[]): Promise`

Invalidate cached contents after an editor save or external file change.

```js
await fileIndex.markDirty([fileUrl]);
```

### `clear(roots?: string[]): Promise`

Remove native indexes for the given roots (or clear as implemented by the native layer).

```js
await fileIndex.clear([rootUrl]);
```

### `whenReady(roots?: string[]): Promise`

Wait until in-flight scans finish. Pass roots to wait only for those workspaces.

```js
await fileIndex.whenReady(roots);
const { entries } = await fileIndex.query({ roots, text: query });
```

### `subscribe(listener): () => void`

Listen for scan / index events. Returns an unsubscribe function.

```js
const stop = fileIndex.subscribe((event) => {
  if (event.type === "status") {
    console.log(event.message, event.progress);
  }
});

// later
stop();
```

### `cancel(id: string): Promise`

Cancel a scan or search job by id.

## Entry shape

Query and search results use flat records (not nested `Tree` objects):

| Field | Type | Description |
| --- | --- | --- |
| `rootUrl` | `string` | Workspace root URL |
| `parent` / `parentUrl` | `string` | Parent directory URL |
| `name` | `string` | File or folder name |
| `path` | `string` | Path relative to the workspace title |
| `url` / `uri` | `string` | Absolute URL |
| `mime` / `type` | `string` | MIME type when known |
| `isDirectory` | `boolean` | Directory flag |
| `isFile` | `boolean` | File flag |
| `size` | `number` | Size in bytes |
| `modifiedDate` | `number` | Last modified timestamp |

## Migrating from `fileList`

### Before (deprecated)

```js
const fileList = acode.require("fileList");
const files = fileList(); // all files as Tree objects

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
4. **SAF + `file://` only** — keep using `fileList` for FTP/SFTP if needed.
5. **Search events may be batched** — handle `search-results` as well as `search-result`.

Hybrid pattern (native roots + remote fallback):

```js
const fileIndex = acode.require("fileIndex");
const fileList = acode.require("fileList");
const addedFolder = acode.require("addedfolder");

const nativeRoots = [];
const remoteFiles = [];

for (const folder of addedFolder) {
  if (!folder.listFiles) continue;
  if (fileIndex.supports(folder.url)) {
    nativeRoots.push(folder.url);
  }
}

const { entries } = nativeRoots.length
  ? await fileIndex.query({ roots: nativeRoots, text: query, limit: 300 })
  : { entries: [] };

// Non-native providers still appear in the legacy list
for (const file of fileList()) {
  remoteFiles.push(file);
}
```

## Events

Scan and search jobs emit events with a shared shape. Common `type` values:

| Type | When |
| --- | --- |
| `status` | Progress message during scan/search |
| `progress` | Numeric progress (`data` is 0–100) |
| `batch` | Optional entry batches during scan |
| `search-result` | One file's matches (`batchResults: false`) |
| `search-results` | Array of file match payloads (`batchResults: true`) |
| `replace-result` | File content after replace |
| `done` | Scan finished |
| `cancelled` | Scan cancelled |
| `done-searching` / `done-replacing` | Search/replace finished |
| `error` | Failure (`error` message string) |
