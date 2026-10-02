# EditorManager

## `window.editorManager` or `editorManager`

The `editorManager` allows you to interact with the editor instance and listen to app-level editor events. Use it for open files/tabs, multi-pane layout, and the active CodeMirror view.

::: danger
`editorManager` is **not** a requirable module. In v1.13.5, `acode.require("editorManager")` returns `undefined` — the manager is never passed to `acode.define()`, so no module is registered under that name. Only `window.editorManager` (or the bare global `editorManager`) is valid.
:::

```js
const manager = window.editorManager;             // correct
const notAModule = acode.require("editorManager"); // undefined — do not use
```

For comparison, these *are* requirable because they are registered with `acode.define()`: `EditorFile`, `commands`, `fileBrowser`, `editorLanguages`, `editorThemes`, `codemirror`, `codeHighlight`.

::: warning
`window.editorManager` is initialised to `null` during boot and is only replaced with the real manager after the first CodeMirror `EditorView` has been constructed. Read it **lazily** — inside a command, an event listener, or after awaiting — instead of capturing it at plugin-load time.
:::

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

Because it is a real `EditorView`, everything CodeMirror 6 offers is available — `dispatch()`, `state`, `selection`, `focus()`, `posAtCoords()`, `coordsAtPos()`, `requestMeasure()`, `dom` / `contentDOM` / `scrollDOM`. See [CodeMirror packages](../utilities/codemirror.md) for how to get the same package instances the app uses.

```js
const view = editorManager.editor;

const { from, to } = view.state.selection.main; // main range
const ranges = view.state.selection.ranges;      // every cursor
const line = view.state.doc.lineAt(view.state.selection.main.head);

view.dispatch({
  selection: { anchor: line.from, head: line.to },
  scrollIntoView: true,
});
```

::: tip
Prefer `acode.require("commands")` for command registration/removal in new plugins.  
See: [Commands API](../utilities/commands.md)
:::

Compatibility helpers are also available for legacy plugins (see [CodeMirror and Legacy Ace Compatibility](./ace.md)):

| Helper | Signature | Notes |
|---|---|---|
| `session` | `Proxy<EditorState> \| null` | The active pane's active-file session |
| `getValue()` | `() => string` | Full document text |
| `gotoLine(line, column = 0, animate = false)` | `=> boolean` | Accepts `16`, `16:5`, `"+5"`, `"-3"`, `"50%"` |
| `insert(text)` | `(text) => boolean` | Replaces the current selection, cursor lands after the insert |
| `getCursorPosition()` | `() => { row, column }` | **1-based** row |
| `getSelectionRange()` | `() => { start, end }` | **0-based** rows |
| `moveCursorToPosition({ row, column })` | `=> void` | Treats `row` as 1-based |
| `selection.anchor` | `number` | Main-selection anchor offset |
| `selection.getRange()` | `() => { start, end }` | **1-based** rows |
| `selection.getCursor()` | `() => { row, column }` | Same as `getCursorPosition()` |
| `getCopyText()` | `() => string` | Selected text, `""` when the selection is empty |
| `scrollToRow(row)` | `(row) => boolean` | `Number.POSITIVE_INFINITY` jumps to the end |
| `setTheme(themeId)` | `(themeId) => boolean` | Must be a registered theme id |
| `setSelection(value)` / `setMenu(value)` | `(value) => void` | Touch-selection menu toggles |
| `execCommand(commandName, args)` | `=> boolean` | Wraps the command registry |
| `commands.addCommand(descriptor)` | `(descriptor) => command` | Registers and refreshes the keymap of this view |
| `commands.removeCommand(name)` | `(name) => void` | Unregisters and refreshes the keymap of this view |
| `commands.commands` | `{ [name]: command }` | Read-only snapshot |

::: warning
The row bases are inconsistent on purpose-for-compatibility: `getCursorPosition()` / `selection.getRange()` are 1-based while `getSelectionRange()` is 0-based. Do not mix them in the same calculation — prefer raw `state.selection.main` offsets.
:::

### `isCodeMirror: boolean`

Hard-coded `true` in this version. Ace is no longer bundled, so there is no Ace build where this is falsy; treat any falsy value as "too old to matter", not as "Ace fallback".

### `activeFile: EditorFile | null`

Currently focused file/tab. It is `null` before any tab is opened and after the last tab closes, and it can point at a non-editor tab (`type !== "editor"`, e.g. a terminal, image, video, audio or custom plugin tab). See [Editor File](../editor-components/editor-file.md).

### `files: EditorFile[]`

All open files across every pane, flattened in layout order (top-left pane first).

### `container: HTMLElement`

Editor container of the **active pane**. Prefer this over assuming a single global editor DOM node when split panes are open.

### `header`

Editor header tile. You can set subtitle text with `editorManager.header.subText = "..."`.

### `openFileList: HTMLElement`

Open-file tab list (pane-aware when multi-pane layout is active).

### `isScrolling: boolean`

Whether the active editor is currently scrolling.

### `editorHistory: EditorFile[]` / `editorHistoryIndex: number`

The tab-switch history stack (max 100 entries) and the current position in it.

### `TIMEOUT_VALUE: number`

The debounce (ms, `500`) applied before `file-content-changed` / `update:file-changed` fire after a document change.

### `readOnlyCompartment`

The CodeMirror `Compartment` that toggles read-only state. Exposed so `EditorFile.setReadOnly()` can reconfigure it; plugins should prefer `file.setReadOnly(value)`.

### `onupdate(...args)`

Internal app hook. Acode assigns its own handler to it during boot, so plugin assignments get overwritten. Listen to [events](#events) instead.

## Opening files

There is no `editorManager.addNewFile` or `editorManager.openFile` API. Create tabs with:

```javascript
const EditorFile = acode.require("EditorFile");

// Preferred — gives you the instance back
const file = new EditorFile("example.js", {
  text: "console.log('hi')",
  render: true,
});

// Or via acode (note: returns undefined)
acode.newEditorFile("example.js", {
  text: "console.log('hi')",
  render: true,
});
```

To open a file that already exists on disk, construct it with a `uri` and let it load:

```javascript
const file = new EditorFile("example.js", { uri, render: true });
await file.load();
```

Switching between already-open tabs is done through the file itself or `switchFile`:

```javascript
editorManager.switchFile(file.id);   // accepts an id
file.makeActive();                   // or activate the instance directly
```

See [Editor File](../editor-components/editor-file.md) for full options (`pinned`, `paneId`, custom tabs, etc.).

### `addFile(file: EditorFile)`

Registers an already-constructed `EditorFile` instance with the manager (used internally and by advanced plugins). The `EditorFile` constructor already calls this for you.

### `getFile(checkFor, type = "id")`

Finds an open file. Returns `undefined` when nothing matches.

- `checkFor`: the value to compare against
- `type`: `"id"` | `"name"` | `"uri"` — **any other value matches nothing**

```javascript
editorManager.getFile("default-session", "id");
editorManager.getFile("index.js", "name");
editorManager.getFile("file:///storage/emulated/0/index.js", "uri");
```

### `switchFile(id, targetPane = null)`

Switches the active tab to the given file id. `targetPane` forces which pane hosts the file; when omitted the pane already containing the file is used, falling back to the active pane. Fires `switch-file`.

### `hasUnsavedFiles(): number`

Returns the number of unsaved files. Each file's dirty state is recomputed first, so this is accurate even if the doc changed within the debounce window.

## Multi-pane layout

Acode supports side-by-side / stacked editor panes. Each pane has its own CodeMirror instance, tab list, and active file.

### Properties

| Property | Description |
|---|---|
| `activePane` | Currently focused pane |
| `panes` | Array snapshot of all panes |
| `activePaneTabList` | Tab list element for the active pane |

A pane object exposes `id`, `files`, `activeFile`, `editor`, `editorContainer`, `tabList`, `content`, `element`, `layoutNode`, `touchSelectionController`.

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
  activate: true, // focus the new pane when nothing is moved/created
  sourcePane: editorManager.activePane, // default: the active pane
});

// Close panes
editorManager.closeActivePane();  // boolean
editorManager.closeEmptyPane(pane); // boolean, only when the pane has no files
```

`createPane` / `splitPane*` resolve to the new pane object, or `null` when there is not enough space (a horizontal split needs ≥ 360 px, a vertical split ≥ 220 px) or when the pane editor failed to build.

### Focusing panes

```javascript
editorManager.focusNextPane();
editorManager.focusPreviousPane();
editorManager.focusPaneByDirection("left"); // "left" | "right" | "up" | "down"
editorManager.setActivePane(pane);
```

`focusNextPane` / `focusPreviousPane` / `focusPaneByDirection` return `false` when there is only one pane or no neighbour in that direction. `setActivePane(pane, options)` returns the pane.

### Moving files between panes

```javascript
await editorManager.moveActiveFileToNewPane("vertical");

editorManager.moveFileToPane(file, targetPane, {
  activate: true,
  index: null, // optional tab position
  createSourcePlaceholder: true, // default: create an empty tab if the source pane empties
  activateSourceFallback: true, // default: focus another tab in the source pane
});

editorManager.removeFileFromPane(file);
editorManager.getFilePane(file); // pane hosting the file, or null
editorManager.getPaneFiles(pane); // files in a pane
```

`removeFileFromPane(file)` returns `{ pane, wasPaneActive, nextFile }`, or `null` if the file is not in any pane.

### Pin helpers

Pinned tabs stay grouped at the front of a pane's tab list:

```javascript
file.setPinnedState(true, { reorder: true });
editorManager.moveFileByPinnedState(file);
editorManager.normalizePinnedTabOrder(pane);
```

### Tab order and layout

```javascript
// Reorder after a drag, using the pane's own <ul> element
editorManager.updatePaneFileOrderFromTabs($tabList, { draggedFile });

// Rebuild the visible tab list from the pane model
editorManager.syncOpenFileList();
```

## Tab history

```javascript
editorManager.openPreviousEditorFromHistory(); // boolean
editorManager.openNextEditorFromHistory();     // boolean
editorManager.recordHistory(file);             // usually automatic on switch
```

## LSP / cache helpers

```javascript
// Restart language clients for the active editor file
editorManager.restartLsp();

// Flush pending crash-cache writes for open editor files
await editorManager.flushCacheWrites();
```

`getLspMetadata(file, targetEditor)` returns `{ uri, languageId, languageName, view, file, rootUri }` for an editor-type file, or `null` when no LSP URI can be derived. `languageName` is the file's `currentMode` (falling back to `mode`, then the resolved language id).

## Other methods

| Method | Returns |
|---|---|
| `revealRange(from, to = from, options)` | `boolean` — moves the selection and scrolls it into view; `options` is `{ y = "center", userEvent = "select.reveal" }` |
| `reapplyActiveFile()` | `void` — force-recreates the active editor state from the file's session |
| `getEditorHeight(view)` | `number` — remaining vertical scroll extent of a view |
| `getEditorWidth(view)` | `number` — remaining horizontal scroll extent of a view |
| `getPaneTabList(fileOrPane)` | `HTMLElement \| null` — accepts a pane, a file, or a pane id |
| `splitPane(direction = "horizontal")` | `Promise<pane \| null>` |

## Events

### `on(types, callback)` / `off(types, callback)` / `emit(event, ...args)`

`types` may be a single name or an array of names. `on` creates a bucket for any name, so custom names work as long as something emits them.

| Event | Payload | Fires when |
|---|---|---|
| `switch-file` | `(file: EditorFile)` | The active tab changed, or a pane became active with a file |
| `rename-file` | `(file: EditorFile)` | `file.filename` or `file.uri` changed |
| `save-file` | `(file: EditorFile)` | A save completed successfully |
| `file-loaded` | `(file: EditorFile)` | An active file finished loading text from the provider |
| `file-loading-preview` | `(file: EditorFile, text: string)` | A remote (FTP/SFTP) preview text arrived while loading |
| `file-content-changed` | `(file: EditorFile)` | After a debounced document change (`TIMEOUT_VALUE`, 500 ms) |
| `editor-state-changed` | `(view: EditorView)` | On every transaction where `docChanged` is true — **not** debounced, and only while an editor-type file is active in that pane |
| `add-folder` | `(event)` | A workspace folder was added |
| `remove-folder` | `(event)` | A workspace folder was removed |
| `new-file` | `(file: EditorFile)` | A new `EditorFile` was constructed |
| `remove-file` | `(file: EditorFile)` | A tab was closed |
| `int-open-file-list` | `(openFileListPos: string)` | The open-file list container was rebuilt |
| `update` | `(subAction, ...)` | See the table below |

::: warning
The event name is `int-open-file-list` (no `i` after the dash) — that is the literal string the app emits.
:::

### `update` sub-actions

`update` is emitted as `emit("update", subAction, ...)`. Every sub-action is **also** emitted as its own event under the name `update:<subAction>`, with the sub-action stripped from the arguments.

```javascript
editorManager.on("update", (action, payload) => {
  console.log(action, payload);
});
```

| Sub-action | Extra arguments | Meaning |
|---|---|---|
| `"file-changed"` | – | Debounced document change |
| `"read-only"` | – | `file.editable` toggled |
| `"pin-tab"` | `(file: EditorFile)` | Pin state changed |
| `"save-file"` | – | A save completed |
| `"add-folder"` | – | Workspace folder added |
| `"remove-folder"` | – | Workspace folder removed |
| `"delete-file"` | – | A file was deleted from a folder |
| `"delete-folder"` | – | A folder was deleted |

`"switch-file"`, `"rename-file"` and `"remove-file"` are **not** emitted through `update` — they only reach the app-internal `onupdate` hook. Subscribe to the dedicated events instead.

```javascript
editorManager.on("switch-file", () => {
  console.log("user switched file", editorManager.activeFile?.filename);
});

editorManager.on("update:pin-tab", (file) => {
  console.log("pin state changed", file?.filename, file?.pinned);
});
```

## Complete example

```js
const commands = acode.require("commands");

const onSave = (file) => {
  console.log("saved:", file.filename);
};

const onRemove = (file) => {
  file.off("save", onSave);
};

commands.addCommand({
  name: "example.insertBanner",
  description: "Insert a banner at the cursor",
  exec: (view, args) => {
    const manager = window.editorManager;
    const file = manager.activeFile;

    if (!file || file.type !== "editor") return false;
    if (!file.loaded || file.loading) return false;

    const text = `// ${args?.name || "banner"}\n`;

    // Insert through the live view so selection, undo history and the file's
    // dirty state all stay in sync.
    view.dispatch({
      changes: {
        from: view.state.selection.main.from,
        to: view.state.selection.main.to,
        insert: text,
      },
      selection: { anchor: view.state.selection.main.from + text.length },
    });

    file.on("save", onSave);
    file.on("close", onRemove);

    file.save();
    return true;
  },
});
```

## Gotchas

- **`window.editorManager` is `null` until the editor is built.** Read it inside the command / listener, never at plugin-load time.
- **`activeFile` is `null`** before the first tab and after the last one closes. Guard every access.
- **`activeFile.type` is not always `"editor"`.** Only editor-type files have a `session`, a `currentMode`, and a CodeMirror view. Terminals, images, video, audio and custom plugin tabs do not.
- **`editorManager.editor` follows the active pane.** After a pane switch it is a *different* `EditorView` object. Never hold a captured view across a `switch-file`; re-read the getter. To reach the view of a specific file use `editorManager.getFilePane(file)?.editor`.
- **`file-content-changed` is debounced by 500 ms.** Listen to `editor-state-changed` if you need every keystroke, or set `file.markChanged = false` to opt a file out of the change pipeline entirely.
- **`emit()` only reaches buckets that exist.** An event name that was never declared in the manager's event map and never subscribed to via `on()` is silently dropped.
- **Splitting needs room.** `createPane` returns `null` (and toasts) instead of throwing when the pane would be too small.
- **`onupdate` belongs to the app.** Acode overwrites it during boot.