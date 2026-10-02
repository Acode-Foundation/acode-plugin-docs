# File List API <Badge type="warning" text="Deprecated" />

::: danger Deprecated — migrate to File Index
`acode.require("fileList")` is **deprecated** in the Acode **v1.13.5** source (`src/lib/fileList.js`, `src/lib/acode.js`).

- SAF (`content:`) and `file://` workspaces are no longer listed here at all. Those roots are routed to the native index.
- `fileList` now contains **non-native** providers only (FTP, SFTP, custom storage).
- Calling the returned function logs a one-time `console.warn`, and the module carries `deprecated` / `replacement` markers.

**Full replacement guide: [`fileIndex`](./file-index.md).** Everything below documents the legacy surface for plugins that still need remote-provider trees.
:::

::: code-group
```js [Migrate to fileIndex]
const fileIndex = acode.require("fileIndex");
const { entries, hasMore } = await fileIndex.query({
  roots: [workspaceUrl],
  text: "filename",
  limit: 200,
});

for (const file of entries) {
  console.log(file.name, file.path, file.url);
}
```

```js [Keep fileList, remote providers only]
const fileList = acode.require("fileList");

for (const file of fileList()) {
  console.log(file.name, file.path, file.url); // Tree leaves
}
```
:::

The File List API builds an in-memory tree for workspace files. After the deprecation change, that tree only covers providers that **cannot** use the native index.

## What deprecation actually does <Badge type="tip" text="new" />

`src/lib/acode.js` wraps the module before handing it to you:

```js
let didWarnAboutFileList = false;
const deprecatedFileList = (...args) => {
  if (!didWarnAboutFileList) {
    didWarnAboutFileList = true;
    console.warn(
      'acode.require("fileList") is deprecated. Use the asynchronous "fileIndex" API. fileList now contains only non-native storage providers.',
    );
  }
  return files(...args);
};
Object.assign(deprecatedFileList, files);
deprecatedFileList.deprecated = true;
deprecatedFileList.replacement = "fileIndex";
```

Consequences you can rely on:

| Property / behaviour | Value |
| --- | --- |
| `fileList.deprecated` | `true` |
| `fileList.replacement` | `"fileIndex"` |
| Console warning | Exactly the string above, logged **once per app session**, on the first **invocation** of the function — not on `acode.require()` itself |
| `fileList()` | Same behaviour as the un-deprecated module function |

::: warning The exposed surface is smaller than the module
`Object.assign` copies only the **own enumerable** properties of the module's default export — that is `on` and `off`. The named exports of `src/lib/fileList.js` (`append`, `remove`, `refresh`, `rename`, `whenReady`, `addRoot`, `Tree`, `initFileList`) are **not** copied, so they are **not** reachable from `acode.require("fileList")`.

`acode.require("fileList")` therefore exposes exactly: the callable itself, `.on`, `.off`, `.deprecated` and `.replacement`.
:::

## Usage

### Basic usage

```js
const fileList = acode.require("fileList");

// All file leaves from non-native providers (directories are never returned)
const allFiles = fileList();

// Optional transform, applied to each leaf
const names = fileList((file) => file.name);

// Look up one node by URL — returns the Tree node, or null when not found
const node = fileList("/some/path/file.txt");
```

::: tip Directories are skipped
`fileList()` flattens each root and only collects nodes that have **no** `children`. Folder nodes never appear in the returned array, and each URL is emitted at most once even if two roots overlap.
:::

### Event handling

```js
const fileList = acode.require("fileList");

fileList.on("add-file", (file) => {
  console.log(`New file added: ${file.path}`);
});

fileList.on("remove-file", (file) => {
  console.log(`File removed: ${file.path}`);
});
```

`on` / `off` accept any string; unknown names are silently created as empty arrays.

::: tip
For SAF / `file://` workspaces, `add-file` / `remove-file` tree events no longer fire — those paths are forwarded to `fileIndex.update()` / `fileIndex.clear()` instead. Prefer `fileIndex.query` / `fileIndex.subscribe` for those roots.
:::

## Tree object

The `Tree` object represents files and folders that are still tracked by the JavaScript index (non-native providers).

::: warning
The `Tree` **class** is a named export of `src/lib/fileList.js`, but it is **not** copied onto the module you receive — see the deprecation note above. Plugins only ever get `Tree` instances back as arguments and return values; use `node.name`, `node.path`, `node.url` and the instance getters below. The static helpers are documented for completeness and for anyone porting Acode's own internal code.
:::

### Properties

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Name of the file/folder (read-only getter) |
| `url` | `string` | Absolute URL (read-only getter) |
| `path` | `string` | Path relative to the root title (read-only getter) |
| `children` | `Array<Tree> \| null` | Child entries when this node is a directory; `null` for leaves |
| `parent` | `Tree \| null` | Parent folder reference. Assigning anything but a `Tree` throws |
| `mime` | `string \| null` | MIME type when known, else `null` |
| `size` | `number` | Size in bytes, `0` when unknown |
| `modifiedDate` | `number` | Last modified timestamp in ms, `0` when unknown |
| `retriedCount` | `number` | Consecutive `lsDir` retry counter used by the remote-provider fallback scan |
| `isConnected` | `boolean` | Whether the root is still in the open folder list |
| `root` | `Tree` | Root folder reference |

### Methods

#### `update(url: string, name?: string): void`

Updates the file/folder URL and name (defaults `name` to `Url.basename(url)`) and re-scans the subtree. **Only works for non-native providers** — under a native root the tree node does not exist and the operation is forwarded to `fileIndex.update()` by the module-level `rename()` helper.

```js
tree.update("/new/path/file.txt", "newname.txt");
```

#### `toJSON(): TreeJson`

Converts the tree node to a plain object. Directories are reported via `isDirectory`.

```js
const json = tree.toJSON();
// { name, url, path, parent, mime, size, modifiedDate, isDirectory }
```

#### `Tree.fromJSON(json: object): Tree`

Creates a tree node from JSON data. The `parent` field must be the **URL** of an existing node in the current tree, otherwise the parent link is `null`.

```js
const tree = Tree.fromJSON(jsonData);
```

#### `Tree.create(url: string, name?, isDirectory?, mime?, size?, modifiedDate?): Promise<Tree>`

Creates a new tree instance. When `name` is omitted **and** `isDirectory` is falsy, Acode calls `fsOperation(url).stat()` to fill in `name`, `isDirectory`, `mime`, `size` and `modifiedDate`.

```js
const newTree = await Tree.create("/path/file.txt"); // stat() fills the rest
const folder = await Tree.create("/path/folder", "folder", true);
```

#### `Tree.createRoot(url: string, name: string): Promise<Tree>`

Creates a directory tree root and seeds `path` with `name`.

```js
const root = await Tree.createRoot("ftp://example.com/www", "www");
```

#### `new Tree(name, url, isDirectory?, mime?, size?, modifiedDate?)`

The raw constructor. Prefer the static factories.

## Events

| Event | Description |
| --- | --- |
| `add-file` | File added to the JS index |
| `push-file` | File pushed while scanning a directory (fires immediately before `add-file`) |
| `remove-file` | File removed from the JS index |
| `add-folder` | Folder root added. For a native root the payload is `{url, name, native: true}`; otherwise it is the `Tree` root |
| `remove-folder` | Folder root removed |
| `refresh` | Emitted with the whole `filesTree` map after a refresh |

::: tip
Under a native root, no `add-file` / `remove-file` / `push-file` events fire at all — the changes are forwarded to `fileIndex.update()` / `fileIndex.clear()`. Removing a native **root** emits `remove-folder` with `{url, native: true}`; removing a plain URL never fires `remove-file`.
:::

## Error handling

```js
try {
  const files = fileList();
} catch (err) {
  console.error("Error accessing files:", err);
}
```

`fileList()` itself does not throw on unreachable providers — the fallback scan retries a failing `lsDir()` up to `settings.value.maxRetryCount` times, waiting 3 seconds between attempts, and optionally shows a retry toast (`settings.value.showRetryToast`). It silently drops the subtree when retries are exhausted.

## Migration checklist

1. Replace filename lookup / Quick Open style features with `fileIndex.query`.
2. Replace project-wide content search over local roots with `fileIndex.search`.
3. Keep `fileList` only if you still need FTP/SFTP/custom provider trees.
4. Feature-detect `fileIndex` for plugins that must run on older builds — do not hardcode a `minVersionCode`, since `CHANGELOG.md` records none for this API.
5. Acode's own Find File palette (`src/palettes/findFile/index.js`) is the reference hybrid: open editor tabs + `fileList()` + `fileIndex.query()`, de-duplicated by URL.
