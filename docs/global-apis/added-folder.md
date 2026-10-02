# Added Folder

## `window.addedFolder` or `addedFolder`

The `addedFolder` object is the global object which returns an Array of object. This object provides essential properties and methods to interact with the currently opened folders in the **sidenav** of Acode app. Use these properties and methods to manipulate folder states, reload contents, and manage folder visibility effectively.

::: info
Verified against Acode **v1.13.5** (versionCode `1011`): `export const addedFolder = []` in `src/lib/openFolder.js`. It is a **live array of `Folder` objects**, one per folder open in the file sidebar — not a snapshot, not an event.
:::

### Importing

```js
const addedFolder = acode.require("addedFolder"); // or window.addedFolder
```

`acode.require("addedfolder")` works too — module names are lowercased before lookup.

::: warning Not a copy
`addedFolder` is the same array instance the sidebar mutates: `openFolder()` pushes to it and each `folder.remove()` splices out of it. It holds no copy for you, so keep your own reference and iterate it defensively (`[...addedFolder]`) if you plan to remove entries while looping.
:::

### When it changes

| Moment | What happens |
| --- | --- |
| [`openFolder(url, { name })`](../utilities/open-folder.md) succeeds | A new `Folder` object is **pushed** onto the array |
| `folder.remove()` is called (or `openFolder.removeItem(url)` on that root, or `openFolder.removeFolders(url)` for a subtree) | The object is **spliced out** of the array |
| Anything else — renaming a file, deleting an entry, switching tabs | The array is **not** touched |

There is no callback, event or subscription for this array. To be notified of changes, listen to the editor's `add-folder` / `remove-folder` events (they fire *after* the array has been updated):

```js
editorManager.on("add-folder", ({ url, name }) => { /* addedFolder already contains it */ });
editorManager.on("remove-folder", ({ url }) => { /* already removed */ });
```

### Properties

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string \| undefined` | The `id` passed to `openFolder()`; `undefined` when you did not supply one. |
| `url` | `string` | The URL of the folder. This is the identity used by `openFolder.find()` and for duplicate detection. |
| `title` | `string` | The title of the folder — the `name` you passed to `openFolder()`, shown in the sidebar. |
| `$node` | `HTMLElement` | The HTML element of the folder. A collapsible list whose `$title` and `$ul` carry `dataset.url`, `dataset.name` and `dataset.type = "root"`. |
| `listFiles` | `boolean` | Whether the folder's files were registered as file-list roots. Resolved from `opts.listFiles`, else `acode.require("settings").value.fileBrowser?.listFiles ?? true`. |
| `saveState` | `boolean` | Whether to remember the expanded state of sub-directories. Defaults to `true`. |
| `listState` | `object` | Expanded state as `{ [dirUrl]: boolean }`, updated in place while the folder is open. Pass a plain object as `opts.listState` to seed it. |
| `remove` | `(e?: Event) => void` | Removes the folder from the sidenav (and from the file-list roots). Does **not** delete anything from disk. |
| `reload` | `() => void` | Reloads the folder: collapses and re-expands it, rebuilding the file tree. |
| `clipBoard` | `{ url?: string, $el?: HTMLElement, action?: 'cut' \| 'copy' }` | The folder's pending cut/copy state, set by the long-press "Copy"/"Cut" context menu items. |

::: warning `reloadOnResume` does not exist
`openFolder()` has no `reloadOnResume` option in v1.13.5, and no `Folder` object carries that property — `folder.reloadOnResume` is `undefined`. The same applies to any `name` fallback: `title` is exactly the `name` you passed.
:::

### Methods

There are no methods on the `Folder` objects themselves — only the two functions, `remove` and `reload`, listed above. To *find* a folder use [`openFolder.find(url)`](../utilities/open-folder.md#finding-folders), and to *close* one call `folder.remove()`:

```js
// Find the folder that contains this URL
const folder = acode.require("openFolder").find("file:///sdcard/Project/src/app.js");

if (folder) {
  console.log(folder.title, folder.url, addedFolder.includes(folder)); // true
}
```

### Example

```js
const fs = acode.require("fs");
const openFolder = acode.require("openFolder");
const addedFolder = acode.require("addedFolder");

acode.setPluginInit(plugin.id, async () => {
  const url = `${CACHE_STORAGE}/my-plugin/workspace`;

  await fs(CACHE_STORAGE).createDirectory("my-plugin");
  await fs(`${CACHE_STORAGE}/my-plugin`).createDirectory("workspace");
  openFolder(url, { name: "Plugin workspace", id: "my-plugin-workspace" });

  // The folder is on the array synchronously, right after openFolder().
  const opened = addedFolder.find((folder) => folder.id === "my-plugin-workspace");
  console.log(opened.title, addedFolder.length); // "Plugin workspace" 1

  // Close every folder this plugin owns and clean up.
  [...addedFolder]
    .filter((folder) => folder.id === "my-plugin-workspace")
    .forEach((folder) => folder.remove());

  await fs(`${CACHE_STORAGE}/my-plugin`).delete();
});
```
