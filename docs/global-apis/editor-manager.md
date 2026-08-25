# EditorManager

## `window.editorManager` or `editorManager`

The `editorManager` allows you to interact with the editor instance and listen to app-level editor events. Use it for open files/tabs, multi-pane layout, and the active CodeMirror view.

## Core properties

### `editor`

Active **CodeMirror `EditorView`** for the focused pane.

Read text:

```javascript
const text = editorManager.editor.state.doc.toString();
```

Update text:

```javascript
const view = editorManager.editor;
view.dispatch({
  changes: { from: 0, to: view.state.doc.length, insert: "new content" },
});
```

::: tip
Prefer `acode.require("commands")` for command registration/removal in new plugins.  
See: [Commands API](../utilities/commands.md)
:::

Compatibility helpers are also available for legacy plugins:

- `editor.session` (Ace-style session proxy for the active file)
- `editor.getValue()`
- `editor.gotoLine(...)`
- `editor.insert(text)`
- `editor.getCursorPosition()`
- `editor.moveCursorToPosition({ row, column })`
- `editor.selection.getRange()`
- `editor.getCopyText()`

### `isCodeMirror: boolean`

`true` on modern Acode builds that use CodeMirror 6.

### `activeFile: EditorFile | null`

Currently focused file/tab.

### `files: EditorFile[]`

All open files across every pane.

### `container: HTMLElement`

Editor container of the **active pane**. Prefer this over assuming a single global editor DOM node when split panes are open.

### `header`

Editor header tile. You can set subtitle text with `editorManager.header.subText = "..."`.

### `openFileList: HTMLElement`

Open-file tab list (pane-aware when multi-pane layout is active).

### `isScrolling: boolean`

Whether the active editor is currently scrolling.

### `TIMEOUT_VALUE: number`

Internal debounce/operation timeout used by the editor manager (default `500` ms). Used internally when waiting for editor operations; plugins generally only need it for tuning their own timeouts to match.

### `readOnlyCompartment`

The CodeMirror [`Compartment`](https://codemirror.net/docs/ref/#state.Compartment) used to toggle the read-only state of editor views. Useful for advanced plugins that build their own CodeMirror configuration.

### `getLspMetadata(file): object | null`

Builds the LSP metadata object for a file:

- `uri` - file uri (or an `untitled://acode/<id>` uri for untitled files)
- `languageId` - resolved language id
- `languageName` - `file.currentMode` or the language id
- `view` - the target editor view
- `file` - the file
- `rootUri` - the matching added-folder url, or the file uri

Returns `null` for non-editor files.

### `getEditorHeight(editor): number`

Returns the scrollable height of an editor view (`max(scrollHeight - clientHeight, 0)`).

### `getEditorWidth(editor): number`

Returns the scrollable width of an editor view.

### `reapplyActiveFile()`

Force-recreates the active file's editor state in the current pane (used after configuration changes).

### `syncOpenFileList()`

Synchronizes the visible open-file tab list with the current pane layout and file order.

## Opening files

There is no `editorManager.addNewFile` API. Create tabs with:

```javascript
const EditorFile = acode.require("EditorFile");

// Preferred
new EditorFile("example.js", {
  text: "console.log('hi')",
  render: true,
});

// Or via acode
acode.newEditorFile("example.js", {
  text: "console.log('hi')",
  render: true,
});
```

See [Editor File](../editor-components/editor-file.md) for full options (`pinned`, `paneId`, custom tabs, etc.).

### `addFile(file: EditorFile)`

Registers an already-constructed `EditorFile` instance with the manager (used internally and by advanced plugins).

### `getFile(test, type)`

Finds an open file.

- `test`: id, uri, name, git, or gist key
- `type`: `"uri" | "id" | "name" | "git" | "gist"`

### `switchFile(id: string)`

Switches the active tab to the given file id.

### `hasUnsavedFiles(): number`

Returns the number of unsaved files.

## Multi-pane layout

Acode supports side-by-side / stacked editor panes. Each pane has its own CodeMirror instance, tab list, and active file.

### Properties

| Property | Description |
|---|---|
| `activePane` | Currently focused pane |
| `panes` | Array snapshot of all panes |
| `activePaneTabList` | Tab list element for the active pane |

### Creating and closing panes

```javascript
// Split active pane to the right
const right = await editorManager.splitPaneRight();

// Split below
const below = await editorManager.splitPaneDown();

// Or with options
const pane = await editorManager.createPane({
  direction: "horizontal", // "horizontal" | "vertical" | "right" | "down" | "below"
  moveFile: editorManager.activeFile, // optional: move current file into the new pane
  createUntitled: true, // default true when moveFile is not set
});

// Close panes
editorManager.closeActivePane();
editorManager.closeEmptyPane(pane);
```

`createPane` / `splitPane*` resolve to the new pane object, or `null` when there is not enough space.

### Focusing panes

```javascript
editorManager.focusNextPane();
editorManager.focusPreviousPane();
editorManager.focusPaneByDirection("left"); // "left" | "right" | "up" | "down"
editorManager.setActivePane(pane);
```

### Moving files between panes

```javascript
await editorManager.moveActiveFileToNewPane("vertical");

editorManager.moveFileToPane(file, targetPane, {
  activate: true,
});

editorManager.removeFileFromPane(file);
editorManager.getFilePane(file); // pane hosting the file, or null
editorManager.getPaneFiles(pane); // files in a pane
```

### Pin helpers

Pinned tabs stay grouped at the front of a pane's tab list:

```javascript
file.setPinnedState(true, { reorder: true });
editorManager.moveFileByPinnedState(file);
editorManager.normalizePinnedTabOrder(pane);
```

## Tab history

```javascript
editorManager.openPreviousEditorFromHistory();
editorManager.openNextEditorFromHistory();
editorManager.recordHistory(file); // usually automatic on switch
```

History state is also exposed for inspection:

- `editorManager.editorHistory` - array of `EditorFile` entries in the navigation history (max 100, oldest first).
- `editorManager.editorHistoryIndex` - index of the current position within `editorHistory`.

```javascript
const backStack = editorManager.editorHistory.slice(
  0,
  editorManager.editorHistoryIndex + 1,
);
const forwardStack = editorManager.editorHistory.slice(
  editorManager.editorHistoryIndex + 1,
);
```

## LSP / cache helpers

```javascript
// Restart language clients for the active editor file
editorManager.restartLsp();

// Flush pending crash-cache writes for open editor files
await editorManager.flushCacheWrites();
```

## Events

### `on(event, listener)` / `off(event, listener)` / `emit(event, ...args)`

| Event | Description |
|---|---|
| `switch-file` | Active file changed |
| `rename-file` | File renamed |
| `save-file` | File saved |
| `file-loaded` | File finished loading |
| `file-loading-preview` | Remote-file preview text became available (payload: file, text) |
| `file-content-changed` | File content changed |
| `add-folder` | Workspace folder added |
| `remove-folder` | Workspace folder removed |
| `new-file` | New file created |
| `int-open-file-list` | Open file list initialized |
| `remove-file` | File removed |
| `editor-state-changed` | The active editor's document changed (payload: the CodeMirror view) |
| `update` | Generic update (often with a sub-action) |

`update` listeners may receive a sub-action as the first argument, for example:

- `"pin-tab"`
- `"switch-file"`
- `"read-only"`
- `"file-changed"`

For each `update` emission, a detailed `update:<sub>` event is also emitted (e.g. `update:pin-tab`) whose payload is everything after the sub-action.

```javascript
editorManager.on("switch-file", () => {
  console.log("user switched file", editorManager.activeFile?.filename);
});

editorManager.on("update", (action, file) => {
  if (action === "pin-tab") {
    console.log("pin state changed", file?.filename, file?.pinned);
  }
});
```
