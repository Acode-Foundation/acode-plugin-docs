# Editor File API

The Editor File API provides functionality to create, manage, interact with files/tabs in the Acode editor. It handles file operations, state management, editor session control, custom editor tab, etc.

::: tip
This API is defined in the [Acode source code (src/lib/editorFile.js)](https://github.com/Acode-Foundation/Acode/blob/228a339296a3869fff7ff84e0898378a438931b8/src/lib/editorFile.js).
:::

## Import

```js
const EditorFile = acode.require('editorFile');
```

`acode.require` lower-cases the module name, so `acode.require('EditorFile')` and `acode.require('editorFile')` return the same class.

::: warning
The manager is a global, not a module: `window.editorManager`. `acode.require('editorManager')` returns `undefined`. See [EditorManager](../global-apis/editor-manager.md).
:::

## Constructor

```js
new EditorFile(filename, options)
```

Both arguments are optional. `new EditorFile()` creates the app's default empty tab.

::: info
You can also use [`acode.newEditorFile(filename, options)`](../global-apis/acode.md#neweditorfile-filename-string-options-fileoptions-void) as an alternative — but note that it **returns `undefined`**; it only constructs the file. Use `new EditorFile(...)` when you need the instance back.
:::

### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| filename | `string` | Name of the file | `"untitled.txt"` |
| options | [`FileOptions`](#fileoptions) | File creation options | `undefined` |

::: warning
If a file with the same `id` (or `uri`) is already open, the constructor **does not create a second tab** — it activates the existing one and returns early. Look the file up first with `editorManager.getFile(uri, 'uri')` if that matters.
:::

### FileOptions

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| isUnsaved | `boolean` | Whether file needs to be saved | `false` |
| render | `boolean` | Make file active | `true` |
| id | `string` | ID for the file | `uri.hashCode()` or a fresh UUID |
| uri | `string` | URI of the file | - |
| text | `string` | Session text. Also marks the file as already loaded | - |
| editable | `boolean` | Enable file editing | `!readOnly` |
| readOnly | `boolean` | Open the file as read-only (inverse of `editable`) | `false` |
| deletedFile | `boolean` | File does not exist at source | `false` |
| SAFMode | `'single' \| 'tree'` | Storage access framework mode | - |
| encoding | `string` | Text encoding | `appSettings.value.defaultFileEncoding` |
| cursorPos | `{ ranges: [{ from, to }], mainIndex: number }` | Restored selection | - |
| scrollLeft | `number` | Scroll left position | `0` |
| scrollTop | `number` | Scroll top position | `0` |
| folds | `Array<{ fromLine: number, fromCol: number, toLine: number, toCol: number }>` | Code folds | - |
| type | `string` | Type of content (e.g. `'editor'`, `'custom'`, `'terminal'`, `'image'`, `'video'`, `'audio'`) | `'editor'` |
| tabIcon | `string` | Icon class for the file tab | `'file file_type_default'` |
| content | `string` \| `HTMLElement` | Custom content element or HTML string. For non-editor types (other than `terminal`) the content is mounted inside a Shadow DOM and strings are sanitized using DOMPurify | - |
| stylesheets | `string` \| `string[]` | Custom stylesheets for tab. Entries starting with `http` or `/` become `<link>`, anything else becomes an inline `<style>` | - |
| highlightStyles | `boolean` | Adopt the static CodeMirror highlight stylesheet into this custom tab's shadow root. Use only when the tab will render `codeHighlight` HTML. Added in **v1.13.2** | `false` |
| hideQuickTools | `boolean` | Whether to hide quicktools for this tab | `false` |
| pinned | `boolean` | Pin the tab to prevent accidental closing | `false` |
| paneId | `string` | Target editor pane id (multi-pane layout) | `null` |
| pane | `object` | Target editor pane instance (multi-pane layout) — only its `.id` is read | `null` |
| isPanePlaceholder | `boolean` | Temporary empty tab for an empty pane | `false` |
| persistInSession | `boolean` | Restore the tab in a future app session | `true` |
| docVersion | `number` | Current document version for dirty tracking | `0` |
| savedVersion | `number` | Document version last saved or loaded from disk | `docVersion` |
| cacheVersion | `number` | Document version last written to crash cache | `savedVersion` |
| savedMtime | `number` | File mtime last saved or loaded from disk | `null` |
| diskMtime | `number` | Latest known file mtime on disk | `options.savedMtime` |
| hasDiskConflict | `boolean` | Whether editor and disk both changed | `false` |

::: warning
There is no `onsave` constructor option. Assign `file.onsave = fn` **after** construction — the `save` event and `canSave` check the instance property, not an option.
:::

## Properties

### Read-only Properties

| Property | Type | Description |
|----------|------|-------------|
| type | `string` | Type of content this file represents (`'editor'` unless overridden) |
| tabIcon | `string` | Icon class for the file tab |
| content | `HTMLElement` | Custom content element |
| id | `string` | File unique ID |
| filename | `string` | Name of the file |
| location | `string` | Directory path of the file (`null` in `SAFMode === 'single'`) |
| uri | `string` | File location on the device |
| eol | `'windows' \| 'unix'` | End of line character, derived from the document |
| editable | `boolean` | Whether file can be edited |
| pinned | `boolean` | Whether the file is pinned |
| isUnsaved | `boolean` | Whether file has unsaved changes |
| name | `string` | File name (for plugin compatibility) |
| cacheFile | `string` | Cache file URL |
| icon | `string` | File icon class |
| tab | `HTMLElement` | File tab element |
| SAFMode | `'single' \| 'tree' \| null` | Storage access framework mode |
| loaded | `boolean` | Whether file has completed loading text |
| loading | `boolean` | Whether file is still loading text |
| deletedFile | `boolean` | Whether the file is missing at its source |
| encoding | `string` | Text encoding used for reads and writes |
| session | `Proxy<EditorState>` | Session state with Ace-compatible helper methods. `null` after close |
| hasVersionMetadata | `boolean` | Whether version/mtime tracking is in use |
| headerSubtitle | `string` | Value Acode renders under the header for this file |

### Plain Mutable Fields

These are public instance fields, not accessors — read **and** write them directly.

| Property | Type | Description |
|----------|------|-------------|
| readOnly | `boolean` | Whether file is readonly. Prefer `file.setReadOnly(value)`, which also reconfigures the live CodeMirror compartment |
| markChanged | `boolean` | When `false`, session text changes stop marking the file dirty and stop the change pipeline |
| focused | `boolean` | Whether the editor was focused when the tab was left |
| focusedBefore | `boolean` | Snapshot of `focused` taken when the tab was deactivated |
| paneId | `string \| null` | Id of the pane hosting this tab |
| isPanePlaceholder | `boolean` | Whether this is an auto-created empty tab |
| persistInSession | `boolean` | Whether the tab is restored on next launch |
| lastScrollTop | `number` | Last known vertical scroll offset |
| lastScrollLeft | `number` | Last known horizontal scroll offset |
| docVersion | `number` | Bumped on every edit; drives dirty tracking |
| savedVersion | `number` | `docVersion` as of the last save/load |
| cacheVersion | `number` | `docVersion` as of the last crash-cache write |
| savedMtime | `number \| null` | mtime as of the last save/load |
| diskMtime | `number \| null` | Latest known mtime on disk |
| hasDiskConflict | `boolean` | Editor and disk both changed |
| restoredSelection | `object \| null` | Pending selection to restore |
| restoredFolds | `Array \| null` | Pending folds to restore |
| editorSettings | `object` | `{ tabSize, softTab, textWrap }` snapshot taken at construction |
| currentMode | `string` | Active language mode name, set by `setMode()` |
| currentLanguageExtension | `Function \| null` | Language loader resolved by `setMode()` |

### Writable(setters) Properties

| Property | Type | Description |
|----------|------|-------------|
| id | `string` | Set file unique ID (also renames the crash-cache file) |
| filename | `string` | Set file name. Emits `rename`, then `rename-file`; re-derives the mode when the extension changes |
| location | `string` | Set file directory path (rewrites `uri`) |
| uri | `string` | Set file location; assigning `null` marks the file deleted and unsaved |
| eol | `'windows' \| 'unix'` | Set end of line character by rewriting the document |
| editable | `boolean` | Set file editability; also emits `update` / `update:read-only` |
| pinned | `boolean` | Set file pinned state (delegates to `setPinnedState`) |
| isUnsaved | `boolean` | Force the dirty flag |
| session | `EditorState` | Replace the stored CodeMirror state |

## Methods

### File Operations

#### [save(origin)](#save-origin)
Saves the file to its current location. Resolves `true` when the write succeeded, `false` when it was skipped or a handler declined.

```js
await file.save();
```

#### [saveAs()](#saveas)
Saves the file to a new location.

```js
await file.saveAs();
```

#### [remove(force = false, options = {})](#remove-force-false-options)
Removes and closes the file. Resolves `true` when the tab was closed, `false` when it was blocked (pinned, or the user declined the unsaved-changes prompt).

| Option | Type | Default | Description |
|---|---|---|---|
| `ignorePinned` | `boolean` | `false` | Close a pinned tab anyway |
| `silentPinned` | `boolean` | `false` | Suppress the "unpin tab before closing" toast |
| `suppressPanePlaceholder` | `boolean` | `false` | Internal: skip creating a replacement empty tab |

```js
await file.remove(true); // Force close without save prompt

// Attempt to close a pinned tab, bypassing the pinned check
await file.remove(false, { ignorePinned: true });

// Attempt to close a pinned tab silently (toast suppressed)
await file.remove(false, { silentPinned: true });
```

#### [makeActive()](#makeactive)
Makes this file the active file in the editor.

```js
file.makeActive();
```

#### [removeActive()](#removeactive)
Removes active state from the file (fires `blur`).

```js
file.removeActive();
```

#### [load()](#load)
Loads the file's text into its stored session, reusing an in-flight load. Only meaningful for editor-type files that are not already loaded.

```js
await file.load();
```

#### [render()](#render)
Makes the file active and updates the pane/tab layout (drops leftover placeholder tabs).

```js
file.render();
```

#### [setReadOnly(value)](#setreadonly-value)
Sets `readOnly`, keeps `editable` in sync, and reconfigures the live CodeMirror read-only compartment.

```js
file.setReadOnly(true);
```

#### [setPinnedState(value, options = { reorder: false, emit: true })](#setpinnedstate-value-options-reorder-false-emit-true)
Updates the pinned state, updates the tab, calls `onpinstatechange(value)`, optionally reorders the pane's tabs, and emits `update` with `pin-tab` plus the file. Returns the new boolean value.

```js
file.setPinnedState(false, {});

window.editorManager.on("update", (action, file) => {
    if(action === "pin-tab") doSomething();
});
```

#### [togglePinned()](#togglepinned)
Toggles the pinned state of the file.

```js
file.togglePinned();
```

### Dirty-state Helpers

| Method | Returns | Description |
|---|---|---|
| `hasUnsavedChanges()` | `boolean` | Sync check comparing the live document against the last saved snapshot |
| `refreshUnsavedState()` | `boolean` | Recomputes and applies `isUnsaved`, returns it |
| `isChanged()` | `Promise<boolean>` | Compares the document against the file on disk (native compare with a JS fallback) |
| `markEdited({ exact = false })` | `void` | Bumps `docVersion` and sets `isUnsaved` |
| `markLoaded({ mtime, isUnsaved = false, savedDoc = null })` | `void` | Resets all version/mtime tracking after a load |
| `markSaved({ mtime, savedDoc, savedVersion })` | `void` | Resets tracking after a save |
| `markDiskChanged({ mtime, deleted = false })` | `void` | Records an external disk change / deletion |

### Editor Operations

#### [setMode(mode, options = { recommend: true })](#setmode-mode-options-recommend-true)
Sets the syntax highlighting mode. Without a mode it resolves one from the filename (honouring `localStorage.modeassoc`). Updates `currentMode` / `currentLanguageExtension` and the tab icon. Fires `changeMode` first, and aborts if that event is `preventDefault()`d.

```js
file.setMode('javascript');
file.setMode('myPluginLang', { recommend: false });
```

#### [scheduleCacheWrite(delay = 1500)](#schedulecachewrite-delay-1500)
Schedules a crash-cache write. `delay <= 0` flushes immediately. No-ops for non-editor files, the default session, or files that cannot be saved.

```js
file.scheduleCacheWrite();
await file.flushCacheWrite();
```

#### [writeToCache()](#writetocache)
Writes file content to the crash cache immediately.

```js
await file.writeToCache();
```

#### [canRun()](#canrun)
Resolves whether the file can be run (checks for `index.html` in the parent folder, then a `.html`/`.htm`/`.md`/`.js`/`.svg` filename). Fires `canRun`.

```js
const canRun = await file.canRun();
```

#### [writeCanRun(cb)](#writecanrun-cb)
Overrides the run-button state. `cb` may return a boolean or a Promise for one.

```js
await file.writeCanRun(() => true);
```

#### [run()](#run)
Runs the file in preview mode without using the current file as the entry point. Fires `run` first; `preventDefault()` aborts.

```js
file.run();
```

#### [runFile()](#runfile)
Runs the file using it as the entry point.

```js
file.runFile();
```

#### [runAction()](#runaction)
Asks the OS to run the file (`RUN` file action).

```js
file.runAction();
```

#### [openWith()](#openwith)
Opens file with the system app (`VIEW` action).

```js
file.openWith();
```

#### [editWith()](#editwith)
Opens the file for editing with a system app (`EDIT` action, `text/plain`).

```js
file.editWith();
```

#### [share()](#share)
Shares the file (`SEND` action).

```js
file.share();
```

#### [addStyle(style)](#addstyle-style)
Adds a stylesheet (or inline CSS string) to the tab's shadow DOM. No-op for editor-type tabs.

```js
file.addStyle('custom.css');
```

#### [setCustomTitle(titleFn)](#setcustomtitle-titlefn)
Overrides the text Acode renders under the header for this tab.

```js
file.setCustomTitle(() => "Build 1.2.3");
```

### Reading and Writing Text

There is **no** `getContent()` / `setContent()` / `isModified` / `cursorPosition` / `selection` / `undo()` / `redo()` / `scrollToLine()` on `EditorFile`. Use the session or the live view:

```js
// Read / replace the whole document through the stored state
const stored = file.session.getValue();
file.session.setValue('console.log("hi")');

// Or through the live view for the active file
const view = window.editorManager.editor;
const live = view.state.doc.toString();
const { from, to } = view.state.selection.main;
const { row, column } = view.getCursorPosition();
view.scrollToRow(10);
```

### Closing

There is **no** `close()` or `open()` on `EditorFile` — use [`remove()`](#remove-force-false-options) to close, and `makeActive()` / `new EditorFile(name, { uri })` to open.

### Event Handling

#### [on(event, callback)](#on-event-callback)
Adds an event listener. The event name is lower-cased before lookup, so `on('loadError', fn)` and `on('loaderror', fn)` are equivalent.

```js
file.on('save', (event) => {
    console.log('File saved');
});
```

#### [off(event, callback)](#off-event-callback)
Removes one event listener (removes the first matching reference only).

```js
file.off('save', callback);
```

There is no `emit()` — events are dispatched by the file itself. Each event also has a single-slot property handler (`file.onsave`, `file.onchange`, …) that is invoked before the listeners.

::: warning
`pinstatechange` has **no** event bucket, so `file.on('pinstatechange', fn)` silently does nothing. Assign the property instead: `file.onpinstatechange = (pinned) => {}`.
:::

## Events

The EditorFile class emits the following events. Every payload is a `FileEvent` with `target`, `preventDefault()` and `stopPropagation()`.

| Event | Payload | Fires when |
|-------|---------|------------|
| save | [`SaveFileEvent`](#savefileevent) | A save is about to run; `preventDefault()` or `respondWith()` takes over |
| change | `FileEvent` | **Never emitted by the class.** Listen to `editorManager` `file-content-changed` instead |
| focus | `FileEvent` | `makeActive()` finished |
| blur | `FileEvent` | `removeActive()` |
| close | `FileEvent` | The tab is being destroyed (inside `remove()`) |
| rename | `FileEvent` | `filename` or `location` is being changed; `preventDefault()` aborts the rename |
| load | `FileEvent` | Text finished loading, on the next macrotask after load |
| loadError | `FileEvent` | Loading threw; the tab is then removed |
| loadStart | `FileEvent` | Loading began |
| loadEnd | `FileEvent` | Loading finished (success or failure) |
| changeMode | `FileEvent` | Before `setMode()` resolves a mode; `preventDefault()` skips the change |
| run | `FileEvent` | Before the file is run; `preventDefault()` aborts |
| canRun | `FileEvent` | Before the runnable state is computed; `preventDefault()` skips detection |

### SaveFileEvent

`save` receives a `SaveFileEvent` (a `FileEvent` subclass) with these extras:

| Member | Type | Description |
|---|---|---|
| `saveAs` | `boolean` | `true` when the save came from `saveAs()` |
| `respondWith(result)` | `(result: boolean \| Promise<boolean>) => void` | Claim the save. Must be called exactly once, synchronously, during dispatch. Implies `preventDefault()` |
| `response` | `Promise<boolean> \| undefined` | Set once `respondWith()` was called |

```js
// Persist a custom tab yourself instead of writing it to disk.
async function persist(url, text) {
  const res = await fetch(url, { method: "POST", body: text });
  return res.ok;
}

const customTab = new EditorFile("report.html", { type: "custom", content });

customTab.onsave = (event) => {
  event.respondWith(
    persist("https://example.com/save", customTab.content.textContent),
  );
};
```

## Example Plugin

Insert at the cursor, replace the selection, and save — all against the live CodeMirror view so dirty tracking and undo history stay correct.

::: tip What `readOnly` means on a command
`readOnly: true` means **"this command is allowed to run in a read-only editor"**, not "this command makes things read-only". The gate is `view.state.readOnly ? !!command.readOnly : true` (`src/cm/commandRegistry.js:1623-1626`), and the default for plugin commands is the permissive `true` (`:1798`). So a command that mutates the document must declare `readOnly: false` — otherwise it is allowed to run on a read-only tab, and Acode's transaction filter will not save you: it only drops transactions tagged as user edits (`input` / `delete` / `move` / `undo` / `redo`), so a bare `view.dispatch({ changes })` goes straight through (`src/cm/editorReadOnly.ts:41-50`). See [Commands API → `addCommand(descriptor)`](../utilities/commands.md#addcommanddescriptor).
:::

```js
const commands = acode.require('commands');

function activeEditorFile() {
  const manager = window.editorManager;
  const file = manager.activeFile;
  if (!file || file.type !== 'editor') return null;
  if (!file.loaded || file.loading) return null;
  return file;
}

commands.addCommand({
  name: 'example.wrapSelection',
  description: 'Wrap the selection in a block comment',
  readOnly: false,
  exec: (view) => {
    const file = activeEditorFile();
    if (!file) return false;

    const { from, to } = view.state.selection.main;
    const selected = view.state.doc.sliceString(from, to);

    const insert = `/* ${selected || 'todo'} */`;
    const cursor = from + insert.length;

    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: cursor },
      scrollIntoView: true,
    });

    file.save();
    return true;
  },
});

commands.addCommand({
  name: 'example.insertAtCursor',
  description: 'Insert a snippet at the cursor',
  readOnly: false,
  exec: (view) => {
    const file = activeEditorFile();
    if (!file) return false;

    const { from, to } = view.state.selection.main;
    const snippet = 'console.log("hello");\n';

    view.dispatch({
      changes: { from, to, insert: snippet },
      selection: { anchor: from + snippet.length },
    });

    // Replace the whole document instead
    // view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: snippet } });

    return true;
  },
});
```

## Examples

### Creating a New File

```js
const file = new EditorFile('example.js', {
    text: 'console.log("Hello World");',
    editable: true
});
```

### Creating a Custom File Type

```js
// Method 1: Using HTML string
const file1 = new EditorFile('custom.html', {
    type: 'custom',
    content: '<div class="custom-content"><h1>Custom Content</h1></div>',
    stylesheets: [
        // External stylesheet
        'https://example.com/styles.css',
        // Local stylesheet
        '/styles/custom.css',
        // Inline CSS
        `
        .custom-content {
            padding: 20px;
            background: #f5f5f5;
        }
        `
    ],
    hideQuickTools: true
});

// Method 2: Using HTMLElement
const customElement = document.createElement('div');
customElement.innerHTML = '<h1>Custom Content</h1>';

const file2 = new EditorFile('custom.html', {
    type: 'custom',
    content: customElement,
    stylesheets: ['/styles/custom.css'],
    hideQuickTools: true
});

// Add additional styles later if needed
file1.addStyle('/styles/additional.css');
```

::: warning
Custom Editor Tabs are isolated from main DOM using Shadow DOM, so don't select tab elements using `document`.
:::

Syntax highlighting inside a custom tab is opt-in and added in **v1.13.2**. Set `highlightStyles: true` so the tab's shadow root gets the theme stylesheet, then add the `cm-highlighted` class to the wrapper. See [Code Highlight](../utilities/code-highlight.md).

```js
const codeHighlight = acode.require("codeHighlight");
const source = 'const answer = 42;';
const html = await codeHighlight.highlightCodeBlock(source, "javascript");

const code = document.createElement("code");
code.className = codeHighlight.HIGHLIGHT_CLASS;
code.innerHTML = html;

new EditorFile("snippet.js", {
  type: "custom",
  content: code,
  highlightStyles: true,
  hideQuickTools: true,
});
```

### Saving File Changes

```js
try {
    await file.save();
    console.log('File saved successfully');
} catch (err) {
    console.error('Error saving file:', err);
}
```

### Handling File Events

```js
file.on('save', (event) => {
    console.log('File saved');
});

file.on('focus', (event) => {
    console.log('File activated:', event.target.filename);
});
```

### Running a File

```js
if (await file.canRun()) {
    file.run();
}
```

## Error Handling

The API includes built-in error handling for file operations. Always wrap async operations in try/catch blocks:

```js
try {
    await file.save();
} catch (err) {
    console.error('Error saving file:', err);
}
```

::: tip
Use the `isChanged()` method to check for unsaved changes before closing files.
:::

::: warning
Always handle file operations asynchronously and implement proper error handling.
:::