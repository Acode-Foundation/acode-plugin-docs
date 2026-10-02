# File Browser API

The File Browser API provides a way to let users browse and select files or folders within Acode.

## Import

```js
const fileBrowser = acode.require('fileBrowser');
```

`acode.require("fileBrowser")` returns a **lazy loader wrapper**, not the page component itself. It dynamically imports the real browser on first call, so the UI code is only shipped when a plugin asks for it.

## Signature

```js
fileBrowser(mode, info, doesOpenLast)
```

## Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| mode | `'file'` \| `'folder'` \| `'both'` | The file browser mode | `'file'` |
| info | `string` | Message shown to the user explaining the purpose. Falls back to a built-in string per mode | mode-dependent |
| doesOpenLast | `boolean` | Open the last visited directory instead of the storage list | `true` |

### `mode`

| Value | Behaviour |
|---|---|
| `'file'` | Only files are selectable; a "Select document" entry is added to the storage list |
| `'folder'` | A floating check button confirms the current directory; the resolved object is the **directory you are standing in**, not a child |
| `'both'` | Files and folders are both selectable |

Any other value falls back to `'file'` behaviour. Note that in `'both'` mode the built-in default message is `"file browser"` rather than `"open file"` / `"open folder"`.

### `doesOpenLast`

When `true` (the default) and a previous navigation exists in `localStorage.fileBrowserState`, the browser restores that directory trail and opens the last one. Pass `false` to always land on the storage list (`/`) instead.

## Return Value

Returns a Promise that resolves to a `SelectedFile` object:

```typescript
interface SelectedFile {
		type: 'file' | 'folder';  // Type of selected item
		url: string;              // Full path/URL
		name: string;            // File/folder name
		list?: unknown[];        // Present on folder results: the directory entries
		scroll?: number;         // Present on folder results: saved scroll offset
		mode?: 'single';         // Present on Android SAF "Select document" results
}
```

The exact shape depends on how the user finished:

| How it resolved | Resolved object |
|---|---|
| Tapped a file | `{ type: 'file', url, name }` |
| Tapped the folder check button in `'folder'` / `'both'` mode | `{ type: 'folder', url, name, list, scroll }` — the whole current-directory object is spread in |
| Picked a file through Android's document picker | `{ type: 'file', url, name, mode: 'single', ... }` — `name` comes from the picked `filename` |

::: warning
The wrapper accepts extra arguments and forwards them, but the browser component itself only declares `(mode, info, doesOpenLast)`. A 4th `defaultDir` argument is **silently ignored** — there is no default-directory option in this version.
:::

## Programmatic Use vs Embedding

Use the promise API for "ask the user for a path" flows:

```js
const picked = await acode.require('fileBrowser')('file', 'Pick a config file');
```

The module also exposes helpers for acting on a result without opening any UI yourself:

| Helper | Description |
|---|---|
| `fileBrowser.open(res)` | Routes a result to `openFolder(res)` or `openFile(res)` depending on `res.type` |
| `fileBrowser.openFile(res)` | Opens `res.url` as an editor tab |
| `fileBrowser.openFolder(res)` | Adds `res.url` as a workspace folder and expands it |
| `fileBrowser.openError(err)` / `openFileError(err)` / `openFolderError(err)` | Show the matching error dialog |

::: danger
Embedding the browser component itself is **not** a supported plugin API. There is no exported factory that returns a mountable element — `pages/fileBrowser`'s default export resolves a Promise and pushes its own page onto the app. Use the promise form (or the app commands `acode.exec('open-file')` / `acode.exec('open-folder')` / `acode.exec('open', 'file_browser')`) instead.
:::

## `acode.fileBrowser(mode, info, openLast)`

The same component is also reachable directly on the `acode` object:

```js
const picked = await acode.fileBrowser('folder', 'Select project folder');
```

::: warning
`acode.fileBrowser` forwards only three arguments, so — like the module — it exposes no `defaultDir` parameter. Use `acode.require('fileBrowser')` directly if you ever need to pass something further.
:::

## Examples

### Basic File Selection

```js
// Open file browser to select a file
const fileBrowser = acode.require('fileBrowser');

try {
		const result = await fileBrowser('file', 'Please select a configuration file');
		console.log(`Selected file: ${result.name}`);
		console.log(`File path: ${result.url}`);
} catch (err) {
		console.error('File selection was cancelled');
}
```

### Read the Picked File

```js
const fs = acode.require('fs');

async function pickAndRead(info) {
		let picked;
		try {
				picked = await acode.require('fileBrowser')('file', info);
		} catch (err) {
				// err.code === 0 means the user closed the browser
				console.log(err.message);
				return null;
		}

		if (picked.type !== 'file') return null;

		try {
				return await fs(picked.url).readFile('utf-8');
		} catch (err) {
				console.error('Unable to read', picked.url, err);
				return null;
		}
}

const configText = await pickAndRead('Select a config file');
if (configText) acode.alert('Config', configText);
```

### Folder Selection With `openLast`

```js
// Open folder browser, starting from wherever the user was last time
const fileBrowser = acode.require('fileBrowser');

try {
		const result = await fileBrowser('folder', 'Select project folder', true);
		if (result.type === 'folder') {
				console.log(`Selected folder: ${result.name}`);
				console.log(`Entries in folder: ${result.list?.length ?? 0}`);
		}
} catch (err) {
		console.error('Folder selection was cancelled');
}

// Always start at the storage list instead
const fresh = await fileBrowser('folder', 'Select project folder', false)
		.catch(() => null);
```

### Allow Both File and Folder Selection

```js
// Allow selecting either files or folders
const fileBrowser = acode.require('fileBrowser');

try {
		const result = await fileBrowser('both', 'Select file or folder');
		if (result.type === 'file') {
				console.log('File selected:', result.name);
		} else {
				console.log('Folder selected:', result.name);
		}
} catch (err) {
		console.error('Selection was cancelled');
}
```

### Open Without Showing The Result UI

```js
const fileBrowser = acode.require('fileBrowser');

const picked = await fileBrowser('file', 'Open a file').catch(() => null);
if (picked) fileBrowser.openFile(picked); // or fileBrowser.open(picked)
```

## Error Handling

The File Browser promise rejects in exactly one case: the user closes the browser (back button, lead close icon, or system back).

- The rejection is an `Error` whose `message` is `"User cancelled"` and whose `code` is `0`.
- "File/folder access is denied" and "Selected item cannot be opened" are *not* rejections — the browser shows an error dialog and stays open, so the promise remains pending until the user closes it.

:::tip
Always wrap File Browser calls in try/catch blocks for proper error handling.
:::

## Gotchas

- **The `list` and `scroll` fields only exist on folder results.** A plain file tap resolves to exactly `{ type, url, name }`.
- **`'folder'` mode resolves the directory you are *in*.** The floating check button is disabled while the browser is at `/`, because there is no "current directory" to confirm there.
- **`doesOpenLast` restores a shared trail.** The state lives in `localStorage.fileBrowserState`, so it is shared across every file-browser invocation in the app.
- **Opening an already-open file reuses its tab.** `fileBrowser.openFile(res)` / `acode.exec('open-file')` go through the app's internal `openFile()`, which looks the URI up in the manager and calls `makeActive()` on the existing tab instead of creating a second one.
- **Nothing is validated for you.** `res.url` is whatever the user tapped; wrap `fs()` calls in `try`/`catch` if the URI may not be readable by your plugin.