# OpenFolder

The OpenFolder utility allow to open and manage folders within the side bar of the application. This utility provides various functionalities for handling folder operations, such as opening, removing, reloading, and maintaining state.

::: info
Verified against Acode **v1.13.5** (versionCode `1011`): `src/lib/openFolder.js`. `openFolder(_path, opts)` reads only the five options documented below; the file/folder mutation helpers are **static properties on the function** (`openFolder.add`, `.renameItem`, `.removeItem`, `.removeFolders`, `.find`), not methods on the folder object.
:::

## Usage
To use the `OpenFolder` utility, you need to require it using the Acode's module system and call the `openFolder` function with the appropriate parameters.


## Importing the OpenFolder

To use the OpenFolder, it needs to be imported into plugin as shown below:

```javascript
const openFolder = acode.require('openFolder');
```

`acode.require()` lowercases module names, so `acode.require('openfolder')` returns the identical function.

### Parameters
The `openFolder` function accepts two parameters:
1. `_path` (string): The path (URL) of the folder to be opened. This is a `required` parameter.
2. `opts` (object): An optional object containing additional options for the folder. It includes:
   - `name` (string): **Required.** The title shown for the folder in the sidebar. Omitting it **throws** `Error("Folder name is required")` — it is *not* derived from the file system.
   - `id` (string): An ID to be assigned to the folder. If not provided, `folder.id` is `undefined`.
   - `saveState` (boolean): Whether the expanded/collapsed state of the folder's sub-directories should be remembered while the folder is open. The default value is `true`.
   - `listFiles` (boolean): Whether the folder's files should be registered in the file list. When omitted it falls back to `acode.require("settings").value.fileBrowser?.listFiles ?? true`.
   - `listState` (object): Previously captured expanded state as a plain `{ [dirUrl]: boolean }` map. Defaults to `{}`.

::: warning There is no `reloadOnResume` option
Older revisions of this page documented `reloadOnResume` (and "the folder's name from the file system" as the title fallback). Neither exists in v1.13.5: `openFolder()` reads only `name`, `id`, `saveState`, `listFiles` and `listState`. Passing `reloadOnResume` is silently ignored, and passing no `name` throws synchronously.
:::

::: warning `listState` is read as a plain object
The JSDoc types it as `Map<string, boolean>`, and some internals do understand a `Map`, but the hot paths index it directly (`listState[url]`, `listState[_path]`) and the file tree reads `expandedState[url]`. Pass a **plain object**; a real `Map` will silently lose its entries.
:::

### Example
```javascript:line-numbers
const openFolder = acode.require('openFolder');
const options = {
  name: 'My Documents',
  id: 'folder-1',
  saveState: false,
  listFiles: true,
};
openFolder('file:///sdcard/My Documents', options);
```
In this example, the folder at `file:///sdcard/My Documents` will be opened in the sidebar with the title "My Documents" and `id` `"folder-1"`. Because `saveState` is `false`, expanding and collapsing its sub-folders will not be remembered.

## API

### `openFolder(_path, opts)`

Opens the specified folder in the sidebar.

```js
/**
 * Open a folder in the sidebar
 * @param {string} _path Folder URL
 * @param {object} [opts]
 * @param {string} opts.name Title shown in the sidebar (required)
 * @param {string} [opts.id]
 * @param {boolean} [opts.saveState=true]
 * @param {boolean} [opts.listFiles] Defaults to acode.require("settings").value.fileBrowser?.listFiles ?? true
 * @param {object} [opts.listState={}] Expanded state as { [dirUrl]: boolean }
 * @returns {void}
 */
```

**Parameters:**
- `_path` (string): Path (URL) of the folder.
- `opts` (object): Options for the folder.

**Options:**
- `name` (string): Title of the folder. Required.
- `id` (string): ID for the folder.
- `saveState` (boolean): Remember expanded state of sub-directories. Default `true`.
- `listFiles` (boolean): List the folder's files in the file index.
- `listState` (object): Previously saved expanded state.

**Return value:** `undefined`. The call is **synchronous and does not prompt the user** — no dialog, no loader, no permission request. A folder object is pushed onto [`addedFolder`](../global-apis/added-folder.md) instead; grab it with `openFolder.find(_path)` if you need a handle.

**Side effects**, in order:

1. Returns immediately (no-op) if a folder with the exact same `url` is already open.
2. Creates the sidebar list element, sets `$root.id = "r" + path.hashCode()`, and appends it to the `files` sidebar app.
3. Records the folder in the recents list (`recents.addFolder(path, opts)`).
4. Pushes a `Folder` object onto `addedFolder`.
5. Emits `update` (`"add-folder"`), then `add-folder` on `editorManager`.
6. Registers the folder as a file-list root when `listFiles` is truthy.
7. Auto-expands the root when `listState[path]` is truthy.

::: danger Errors are synchronous
A missing `name` throws **synchronously** — `openFolder(path)` is not an async function, so `try { … } catch` around a plain call is required, and an `await` will not convert it into a rejection:

```js
try {
  openFolder(folderUrl);                 // throws Error("Folder name is required")
} catch (error) {
  acode.toast(error.message, 3000);
}
```
:::

### Errors and unsupported paths <Badge type="tip" text="new" />

`openFolder()` never checks that the path exists, so a typo'd URL still produces a sidebar entry. The failure only surfaces when the user expands it — the app collapses the folder again and reports the error. Verify first:

```js
const fs = acode.require("fs");
if (await fs(folderUrl).exists()) {
  openFolder(folderUrl, { name: "My Documents" });
}
```

## Methods

### `remove()`
Removes the folder from the sidebar. This is a property of the **folder object** from [`addedFolder`](../global-apis/added-folder.md), not of `openFolder`:

```js
const folder = acode.require("addedFolder").find((f) => f.url === folderUrl);
folder?.remove();
```

`remove()` also drops the file-list root (`FileList.remove(path)`) and emits `update` (`"remove-folder"`) followed by `remove-folder` on `editorManager`. It removes the sidebar entry only — it does **not** delete anything from disk.

### `reload()`
Reloads the folder in the sidebar — a property of the folder object, and implemented as `collapse()` followed by `expand()`, i.e. it destroys and rebuilds the file tree:

```js
folder.reload();
```

### Adding Files and Folders
You can also dynamically add files and folders to the opened folder.

`openFolder.add(url, type)` is a static property. It appends the entry to the file list (`FileList.append`) and inserts it into every **expanded** view of its parent directory. It returns a `Promise` because it stats the parent to resolve the parent URL:

**Example:**
```javascript
await openFolder.add('/path/to/newFile.txt', 'file');
await openFolder.add('/path/to/newFolder', 'folder');
```

| Parameter | Type | Description |
| --- | --- | --- |
| `url` | `string` | URL of the entry to show. |
| `type` | `'file' \| 'folder'` | Which list/tile to render. Anything other than `'folder'` renders a file tile. |

::: warning Real URLs required
Both parameters are raw URLs, and `add()` calls `stat()` on the parent, so a placeholder like `/path/to/newFile.txt` rejects. Pass a full `file://` / `content://` URL.
:::

### Renaming Items
To rename an existing file or folder, call `openFolder.renameItem(oldUrl, newUrl)`:

```javascript
openFolder.renameItem('file:///sdcard/oldFile.txt', 'file:///sdcard/newFile.txt');
```

It takes **exactly two arguments** — the old and the new URL. Any third argument is ignored. It does **not** touch the file system: it renames the entry in the file list (`FileList.rename`), repoints every open editor file whose `uri` was the old URL (`helpers.updateUriOfAllActiveFiles`), and refreshes and re-keys the expanded state of any affected folder. Perform the actual rename with `fs(url).renameTo(newName)` first, then call this.

### Removing Items
To remove an existing file or folder:

```javascript
openFolder.removeItem('file:///sdcard/fileOrFolder');
```

It removes the entry from the file list (`FileList.remove`). If `url` is itself an **open folder root**, it calls that folder's `remove()` (closing the folder) and returns; otherwise it drops the rendered entry from every expanded tree. It does not delete anything from disk.

### Removing Folders
To remove multiple folders based on a URL pattern:
```javascript
openFolder.removeFolders('file:///sdcard/Project');
```
Every open folder whose URL **is or is nested below** the given URL is closed (`Url.isSameOrDescendant`), so this is the call to make when a whole remote storage goes away.

### Finding Folders
To find the folder containing a specific URL:
```javascript
const folder = openFolder.find('file:///sdcard/fileOrFolder');
```
It matches the exact folder URL first, then falls back to the nearest folder that contains the URL as a descendant. Returns `undefined` when no open folder covers the URL, so always optional-chain.

## Event Handling
The `openFolder` utility emits various events on the **global `editorManager`** to help manage folder operations:
- `add-folder` — a folder was just opened.
- `remove-folder` — a folder was closed.
- `update` — fired with the sub-event name as its first argument (`"add-folder"`, `"remove-folder"`, `"delete-file"`, `"delete-folder"`, `"switch-file"`, …). The editor also re-emits this as `update:add-folder`, `update:remove-folder`, etc.

There is **no `update-folder` event**; use `update` with the sub-event name, or listen for `add-folder` / `remove-folder` directly.

Both folder events receive `{ url, name }`.

These events can be listened to for performing custom actions upon folder operations.

**Example:**
```javascript
const addedFolder = acode.require('addedFolder');

function onAddFolder(event) {
  console.log('Folder added:', event.url, event.name);
  // The folder object is already on addedFolder by the time this fires.
  console.log(addedFolder.find((f) => f.url === event.url));
}

function onRemoveFolder(event) {
  console.log('Folder removed:', event.url);
}

function onUpdate(subEvent) {
  // Generic hook: receives the sub-event name.
  if (subEvent === 'add-folder' || subEvent === 'remove-folder') {
    console.log(subEvent, addedFolder.length, 'folder(s) open');
  }
}

acode.setPluginInit(plugin.id, () => {
  editorManager.on('add-folder', onAddFolder);
  editorManager.on('remove-folder', onRemoveFolder);
  editorManager.on('update', onUpdate);
});

acode.setPluginUnmount(plugin.id, () => {
  editorManager.off('add-folder', onAddFolder);
  editorManager.off('remove-folder', onRemoveFolder);
  editorManager.off('update', onUpdate);
});
```

::: info Unsubscribe with `off`
`editorManager.on(types, callback)` accepts one event name or an array; `editorManager.off(types, callback)` removes **by function identity**, so keep the exact reference you passed to `on`. There is no `once` helper — wrap the body and call `off` inside it if you need one-shot behaviour.
:::

## Complete Example <Badge type="tip" text="new" />

```js
const fs = acode.require("fs");
const openFolder = acode.require("openFolder");
const addedFolder = acode.require("addedFolder");

const FOLDER_URL = `${CACHE_STORAGE}/my-plugin/workspace`;

function onAddFolder({ url, name }) {
  acode.toast(`Watching ${name}`, 1500);
}

function onUpdate(subEvent) {
  if (subEvent === "remove-folder") {
    acode.toast(`${addedFolder.length} folder(s) left`, 1500);
  }
}

acode.setPluginInit(plugin.id, async () => {
  // 1. Make sure the folder exists before asking the sidebar to show it.
  await fs(CACHE_STORAGE).createDirectory("my-plugin");
  await fs(`${CACHE_STORAGE}/my-plugin`).createDirectory("workspace");

  if (!(await fs(FOLDER_URL).exists())) {
    acode.toast("Workspace folder is missing", 3000);
    return;
  }

  // 2. Open it. A missing name throws synchronously.
  try {
    openFolder(FOLDER_URL, {
      name: "Plugin workspace",
      id: "my-plugin-workspace",
      saveState: true,
      listFiles: false,
    });
  } catch (error) {
    acode.toast(`Could not open folder: ${error.message}`, 3000);
    return;
  }

  // 3. React to folder changes.
  editorManager.on("add-folder", onAddFolder);
  editorManager.on("update", onUpdate);
});

acode.setPluginUnmount(plugin.id, () => {
  editorManager.off("add-folder", onAddFolder);
  editorManager.off("update", onUpdate);

  // Close only this plugin's folder, then delete what it created.
  addedFolder.find((f) => f.id === "my-plugin-workspace")?.remove();
  fs(`${CACHE_STORAGE}/my-plugin`).delete().catch(console.error);
});
```
