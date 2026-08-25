# File List API <Badge type="warning" text="Deprecated" />

::: warning Deprecated — migrate to File Index
`acode.require("fileList")` is **deprecated** from **versionCode `1002`**.

- SAF (`content:`) and `file://` workspaces are no longer fully listed here.
- Those roots live in the native index — use [`fileIndex`](./file-index.md) <Badge type="tip" text="v1002+" />.
- `fileList` still contains **non-native** providers only (FTP, SFTP, custom storage).

```js
const fileIndex = acode.require("fileIndex");
const result = await fileIndex.query({
  roots: [workspaceUrl],
  text: "filename",
  limit: 200,
});
```
:::

The File List API builds an in-memory tree for workspace files. After the deprecation change, that tree only covers providers that **cannot** use the native index.

On first use, Acode may log:

```text
acode.require("fileList") is deprecated. Use the asynchronous "fileIndex" API.
fileList now contains only non-native storage providers.
```

The required module also exposes:

| Property | Value |
| --- | --- |
| `deprecated` | `true` |
| `replacement` | `"fileIndex"` |

## Usage

### Basic usage

```js
const fileList = acode.require("fileList");

// All files from non-native providers (flat list of Tree leaves)
const allFiles = fileList();

// Optional transform
const names = fileList((file) => file.name);

// Look up one path in the tree
const node = fileList("/some/path");
```

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

::: tip
For SAF / `file://` workspaces, `add-file` / `remove-file` tree events may not cover native-indexed files. Prefer `fileIndex.query` / `fileIndex.subscribe` for those roots.
:::

## Tree object

The `Tree` object represents files and folders that are still tracked by the JavaScript index (non-native providers).

### Properties

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Name of the file/folder |
| `url` | `string` | Absolute URL |
| `path` | `string` | Relative path |
| `children` | `Array<Tree> \| null` | Child entries when this node is a directory |
| `parent` | `Tree \| null` | Parent folder reference |
| `mime` | `string \| null` | MIME type when known |
| `size` | `number` | Size in bytes when known |
| `modifiedDate` | `number` | Last modified timestamp when known |
| `isConnected` | `boolean` | Whether the root is still in the open folder list |
| `root` | `Tree` | Root folder reference |

### Methods

#### `update(url: string, name?: string)`

Updates the file/folder URL and name.

```js
tree.update("/new/path/file.txt", "newname.txt");
```

#### `toJSON()`

Converts the tree node to a plain object.

```js
const json = tree.toJSON();
```

#### `Tree.fromJSON(json: object)`

Creates a tree node from JSON data.

```js
const tree = Tree.fromJSON(jsonData);
```

#### `Tree.create(url: string, name?: string, isDirectory?: boolean)`

Creates a new tree instance.

```js
const newTree = await Tree.create("/path/file.txt", "file.txt");
```

## Events

| Event | Description |
| --- | --- |
| `add-file` | File added to the JS index |
| `push-file` | File pushed while scanning a directory |
| `remove-file` | File removed from the JS index |
| `add-folder` | Folder root added (`native: true` for native roots) |
| `remove-folder` | Folder root removed |
| `refresh` | File list refreshed |

## Error handling

```js
try {
  const files = fileList();
} catch (err) {
  console.error("Error accessing files:", err);
}
```

## Migration checklist

1. Replace filename lookup / Quick Open style features with `fileIndex.query`.
2. Replace project-wide content search over local roots with `fileIndex.search`.
3. Keep `fileList` only if you still need FTP/SFTP/custom provider trees.
4. Set `"minVersionCode": 1002` in `plugin.json` when you hard-depend on `fileIndex`.
5. Feature-detect `fileIndex` for plugins that must run on older builds.
