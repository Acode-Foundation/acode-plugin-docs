# Editor File API

The Editor File API provides functionality to create, manage, interact with files/tabs in the Acode editor. It handles file operations, state management, editor session control, custom editor tab, etc.

::: tip
This API is defined in the [Acode source code (src/lib/editorFile.js)](https://github.com/Acode-Foundation/Acode/blob/228a339296a3869fff7ff84e0898378a438931b8/src/lib/editorFile.js).
:::

## Import

```js
const EditorFile = acode.require('editorFile');
```

## Constructor

```js
new EditorFile(filename, options)
```

::: info
You can also use [`acode.newEditorFile(filename, options)`](../global-apis/acode.md#neweditorfilefilename-string-options-fileoptions-editorfile) as an alternative.
Both methods are equivalent and accept & return the same parameters.
:::

### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| filename | `string` | Name of the file | - |
| options | [`FileOptions`](#fileoptions) | File creation options | - |

### FileOptions

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| isUnsaved | `boolean` | Whether file needs to be saved | `false` |
| render | `boolean` | Make file active | `true` |
| id | `string` | ID for the file | - |
| uri | `string` | URI of the file | - |
| text | `string` | Session text | - |
| editable | `boolean` | Enable file editing | `true` |
| deletedFile | `boolean` | File does not exist at source | `false` |
| SAFMode | `'single' \| 'tree'` | Storage access framework mode | - |
| encoding | `string` | Text encoding | `appSettings.value.defaultFileEncoding` |
| cursorPos | `object` | Cursor position | - |
| scrollLeft | `number` | Scroll left position | - |
| scrollTop | `number` | Scroll top position | - |
| folds | `Array<{ fromLine: number, fromCol: number, toLine: number, toCol: number }>` | Code folds | - |
| type | `string` | Type of content (e.g., 'editor') | `'editor'` |
| tabIcon | `string` | Icon class for the file tab | `'file file_type_default'` |
| content | string \|  [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) | Custom content element or HTML string. Strings are sanitized using DOMPurify | - |
| stylesheets | `string\|string[]` | Custom stylesheets for tab. Can be URL, or CSS string | - |
| hideQuickTools | `boolean` | Whether to hide quicktools for this tab | `false` |
| pinned | `boolean` | Pin the tab to prevent accidental closing | `false` |
| readOnly | `boolean` | Open the file as read-only (sets `editable` to `false`) | `false` |
| paneId | `string` | Target editor pane id (multi-pane layout) | - |
| pane | `object` | Target editor pane instance (multi-pane layout) | - |
| isPanePlaceholder | `boolean` | Temporary empty tab for an empty pane | `false` |

#### Version-metadata options

These options seed the dirty-tracking / disk-conflict system (see [Dirty tracking](#dirty-tracking--disk-conflict)).

| Property | Type | Description |
|----------|------|-------------|
| docVersion | `number` | Current document version for dirty tracking |
| savedVersion | `number` | Document version last saved or loaded from disk |
| cacheVersion | `number` | Document version last written to crash cache |
| savedMtime | `number` | File mtime last saved or loaded from disk |
| diskMtime | `number` | Latest known file mtime on disk |
| hasDiskConflict | `boolean` | Whether the editor and disk both changed |

## Properties

### Read-only Properties

| Property | Type | Description |
|----------|------|-------------|
| type | `string` | Type of content this file represents |
| tabIcon | `string` | Icon class for the file tab |
| content | `HTMLElement` | Custom content element |
| id | `string` | File unique ID |
| filename | `string` | Name of the file |
| location | `string` | Directory path of the file |
| uri | `string` | File location on the device |
| eol | `'windows' \| 'unix'` | End of line character |
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
| session | `Proxy<EditorState>` | Session state with Ace-compatible helper methods |
| readOnly | `boolean` | Whether file is readonly. This is a plain field - assign the read-only state on the editor with [`setReadOnly()`](#setreadonlyvalue) |
| markChanged | `boolean` | Whether to mark changes when session text changes |
| currentMode | `string` | Currently active syntax mode name (set by [`setMode()`](#setmodemode)) |
| currentLanguageExtension | `unknown` | CodeMirror language extension for the current mode (may be `null`) |
| headerSubtitle | `string` | Subtitle shown in the editor header for this file |
| hasVersionMetadata | `boolean` | Whether the file has version metadata for dirty tracking |

### Writable(setters) Properties

| Property | Type | Description |
|----------|------|-------------|
| id | `string` | Set file unique ID |
| filename | `string` | Set file name |
| location | `string` | Set file directory path |
| uri | `string` | Set file location |
| eol | `'windows' \| 'unix'` | Set end of line character |
| editable | `boolean` | Set file editability |
| pinned   | `boolean` | Set file pinned state |

::: warning
`readOnly` is **not** a setter. Assigning `file.readOnly = true` only updates the field and does not reconfigure the CodeMirror editor. Use `file.setReadOnly(true)` to actually make the editor read-only.
:::

## Methods

### File Operations

#### [save()](#save)
Saves the file to its current location.

```js
await file.save();
```

#### [saveAs()](#saveas)
Saves the file to a new location.

```js
await file.saveAs();
```

#### [remove(force = false, options = { ignorePinned = false, silentPinned = false })](#removeforce--false)
Removes and closes the file.

```js
await file.remove(true); // Force close without save prompt

// Attempt to close a pinned tab, bypassing the pinned check
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
Removes active state from the file.

```js
file.removeActive();
```

#### [setPinnedState(value: boolean, options = { reorder = false, emit = true })](#setpinnedstate)
Updates Pinned State for the file, triggers reorder (if true), emits Events (editorManager `update` event with `pin-tab` as the first argument and affected File - second argument )

```js
file.setPinnedState(false, {})

editorManager.on("update", (action, file) => {
    if(action === "pin-tab") doSomething();
});
```

#### [togglePinned()](#togglepinned)
Toggles the pinned State of the file

```js
file.togglePinned();
```

#### [render()](#render)
Makes the file active and renders its content. Also removes the default untitled tab and any empty pane-placeholder tabs in the same pane.

```js
file.render();
```

#### [runAction()](#runaction)
Runs the file through the system file action (equivalent to opening it with the run action of the OS).

```js
file.runAction();
```

#### [setCustomTitle(titleFn)](#setcustomtitletitlefn)
Sets a custom title function used for the header subtitle of this file. Called with no arguments, it must return the title string.

```js
file.setCustomTitle(() => `PID: ${file.pid}`);
```

### Editor Operations

#### [setMode(mode?, options?)](#setmodemode)
Sets syntax highlighting mode for the file.

- `mode` (string, optional): Mode name. When omitted (or empty), the mode is resolved from the user's mode associations (`localStorage.modeassoc`) and the filename.
- `options.recommend` (boolean, default `true`): When `false`, skips the "recommend an extension for this language" prompt.

Updates `currentMode` and `currentLanguageExtension`.

```js
file.setMode('javascript');
file.setMode('javascript', { recommend: false });
```

#### [setReadOnly(value)](#setreadonlyvalue)
Sets the read-only state and reconfigures the CodeMirror editor accordingly. This is the correct way to toggle read-only - assigning the `readOnly` field directly does not touch the editor.

```js
file.setReadOnly(true);
```

#### [readCanRun()](#readcanrun)
Async; resolves whether the run button should be shown for this file (checks open-folder `index.html`, runnable extensions, and any `canrun` handler). You normally only need [`canRun()`](#canrun).

```js
await file.readCanRun();
```

#### [isChanged()](#ischanged)
Checks if file has unsaved changes.

```js
const changed = await file.isChanged();
```

#### [canRun()](#canrun)
Checks if file can be run.

```js
const canRun = await file.canRun();
```

#### [writeCanRun(callback)](#writecanruncallback)
Sets whether to show run button.

```js
file.writeCanRun(() => true);
```

#### [run()](#run)
Runs the file.

```js
file.run();
```

#### [runFile()](#runfile)
Runs the file in app.

```js
file.runFile();
```

#### [openWith()](#openwith)
Opens file with system app.

```js
file.openWith();
```

#### [editWith()](#editwith)
Opens file for editing with system app.

```js
file.editWith();
```

#### [share()](#share)
Shares the file.

```js
file.share();
```

#### [addStyle(style)](#addstylestyle)
Adds stylesheet to tab's shadow DOM.

```js
file.addStyle('custom.css');
```

### Event Handling

#### [on(event, callback)](#onevent-callback)
Adds event listener.

```js
file.on('save', (event) => {
    console.log('File saved');
});
```

#### [off(event, callback)](#offevent-callback)
Removes event listener.

```js
file.off('save', callback);
```

## Dirty tracking & disk conflict

Acode tracks whether the in-memory document differs from what is on disk, so it can warn about unsaved changes and detect conflicts where both the editor and the file changed.

State fields:

| Field | Type | Description |
|-------|------|-------------|
| docVersion | `number` | Current document version (incremented on every edit) |
| savedVersion | `number` | Document version last saved or loaded from disk |
| cacheVersion | `number` | Document version last written to the crash cache |
| savedMtime | `number \| null` | File mtime last saved or loaded from disk (ms) |
| diskMtime | `number \| null` | Latest known file mtime on disk (ms) |
| hasDiskConflict | `boolean` | `true` when both the editor and the disk changed |
| hasVersionMetadata | `boolean` | Whether any version metadata has been recorded |

Normally you read `file.isUnsaved` / `file.hasUnsavedChanges()`. Use the `mark*` methods to keep the state accurate when you load, edit, save, or detect external changes.

#### [hasUnsavedChanges(): boolean](#hasunsavedchanges)
Checks whether the file has unsaved changes, comparing the current document with the last saved/loaded document.

```js
if (file.hasUnsavedChanges()) {
  // prompt to save
}
```

#### [refreshUnsavedState(): boolean](#refreshunsavedstate)
Recomputes `isUnsaved` from the current state and returns it.

#### [markLoaded({ mtime, isUnsaved, savedDoc }?)](#markloaded)
Marks the file as loaded. Resets `docVersion` (to `1` when `isUnsaved`, else `0`), sets `savedVersion`, `cacheVersion`, `savedMtime`, and `diskMtime`, and clears `hasDiskConflict`.

#### [markEdited({ exact }?)](#markedited)
Increments `docVersion` and marks the file as unsaved. When `exact` is `true`, `isUnsaved` is recomputed instead of just set to `true`. Gives the file a new id if it was still the default untitled session.

#### [markSaved({ mtime, savedDoc, savedVersion }?)](#marksaved)
Marks the file as saved. Updates `savedVersion`, `savedMtime`, `diskMtime`, clears `hasDiskConflict`, and refreshes `isUnsaved`.

#### [markDiskChanged({ mtime, deleted }?)](#markdiskchanged)
Records an external change. When `deleted` is `true` the file is marked deleted and unsaved. Otherwise sets `hasDiskConflict` when both `docVersion !== savedVersion` and `diskMtime !== savedMtime`, then refreshes `isUnsaved`.

## Cache pipeline

Acode keeps a crash-recovery cache of every open editor file. Changes are written to `cacheFile` (debounced by default) so an app crash does not lose unsaved work.

#### [scheduleCacheWrite(delay = 1500)](#schedulecachewritedelay--1500)
Schedules a cache write after `delay` ms (or writes immediately when `delay <= 0`). No-op when the cache is already up to date with `docVersion`.

```js
file.scheduleCacheWrite(500);
```

#### [flushCacheWrite()](#flushcachewrite)
Flushes any pending scheduled cache write immediately and waits for in-flight writes.

```js
await file.flushCacheWrite();
```

#### [writeToCache()](#writetocache)
Writes file content to cache immediately (see also `isChanged()` below).

```js
await file.writeToCache();
```

## Events

### `on(event, callback)` events

The EditorFile class emits the following events:

| Event | Description |
|-------|-------------|
| save | File is saved |
| change | File content changes |
| focus | File gains focus |
| blur | File loses focus |
| close | File is closed |
| rename | File is renamed |
| load | File is loaded |
| loadError | Error loading file |
| loadStart | File loading starts |
| loadEnd | File loading ends |
| changeMode | Syntax mode changes |
| run | File is run |
| canRun | File runnable state changes |

### `on*` callback properties

Each event also has a direct callback property. Setting it is equivalent to registering a listener for that event:

| Property | Event |
|----------|-------|
| `onsave` | `save` |
| `onchange` | `change` |
| `onfocus` | `focus` |
| `onblur` | `blur` |
| `onclose` | `close` |
| `onrename` | `rename` |
| `onload` | `load` |
| `onloaderror` | `loadError` |
| `onloadstart` | `loadStart` |
| `onloadend` | `loadEnd` |
| `onchangemode` | `changeMode` |
| `onrun` | `run` |
| `oncanrun` | `canRun` |
| `onpinstatechange` | Called with the new pinned value whenever the pinned state changes |

```js
file.onpinstatechange = (pinned) => {
  console.log("pinned:", pinned);
};
```

### Events emitted on `editorManager`

These events fire on `editorManager` (see [EditorManager](../global-apis/editor-manager.md#events)) for file lifecycle:

| Event | Payload | Description |
|-------|---------|-------------|
| `new-file` | `file` | A new file/tab was created |
| `file-loaded` | `file` | The file finished loading its text |
| `file-loading-preview` | `file`, `text` | A remote-file preview became available while loading |
| `file-content-changed` | `file` | Content changed by a plugin (inactive-file edit) |
| `rename-file` | `file` | File renamed or moved |
| `remove-file` | `file` | File removed/closed |

`update` sub-actions are also emitted, for example `"file-changed"`, `"read-only"`, `"pin-tab"`, `"remove-file"`, `"switch-file"`.

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
file.on('change', (event) => {
    console.log('File content changed');
});

file.on('save', (event) => {
    console.log('File saved');
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
