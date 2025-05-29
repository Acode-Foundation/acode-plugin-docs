# Editor File API

The Editor File API provides functionality to create, manage, interact with files/tabs in the Acode editor. It handles file operations, state management, editor session control, custom editor tab, etc.

:::tip
This API is defined in the [Acode source code (src/lib/editorFile.js)](https://github.com/Acode-Foundation/Acode/blob/52bf3a59c4aebe422d8cfdecf5c85191ed6f6004/src/lib/editorFile.js).
:::

## Import

```js
const EditorFile = acode.require('editorFile');
```

## Constructor

```js
new EditorFile(filename, options)
```

:::info
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
| folds | [`Array<Fold>`](https://ajaxorg.github.io/ace-api-docs/classes/src_edit_session_fold.Fold.html) | Code folds | - |
| type | `string` | Type of content (e.g., 'editor') | `'editor'` |
| tabIcon | `string` | Icon class for the file tab | `'file file_type_default'` |
| content | string \|  [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) | Custom content element or HTML string. Strings are sanitized using DOMPurify | - |
| stylesheets | `string\|string[]` | Custom stylesheets for tab. Can be URL, or CSS string | - |
| hideQuickTools | `boolean` | Whether to hide quicktools for this tab | `false` |

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
| isUnsaved | `boolean` | Whether file has unsaved changes |
| name | `string` | File name (for plugin compatibility) |
| cacheFile | `string` | Cache file URL |
| icon | `string` | File icon class |
| tab | `HTMLElement` | File tab element |
| SAFMode | `'single' \| 'tree' \| null` | Storage access framework mode |
| loaded | `boolean` | Whether file has completed loading text |
| loading | `boolean` | Whether file is still loading text |
| session | `AceAjax.IEditSession` | EditSession of the file |
| readOnly | `boolean` | Whether file is readonly |
| markChanged | `boolean` | Whether to mark changes when session text changes |

### Writable(setters) Properties

| Property | Type | Description |
|----------|------|-------------|
| id | `string` | Set file unique ID |
| filename | `string` | Set file name |
| location | `string` | Set file directory path |
| uri | `string` | Set file location |
| eol | `'windows' \| 'unix'` | Set end of line character |
| editable | `boolean` | Set file editability |
| readOnly | `boolean` | Set file readonly state |

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

#### [remove(force = false)](#removeforce--false)
Removes and closes the file.

```js
await file.remove(true); // Force close without save prompt
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

### Editor Operations

#### [setMode(mode)](#setmodemode)
Sets syntax highlighting mode for the file.

```js
file.setMode('javascript');
```

#### [writeToCache()](#writetocache)
Writes file content to cache.

```js
await file.writeToCache();
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

## Events

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
Custom Editor Tabs are isolated from main dom using shadow dom, so don't select tab elements using main dom(`document`).
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

:::tip
Use the `isChanged()` method to check for unsaved changes before closing files.
:::

:::warning
Always handle file operations asynchronously and implement proper error handling.
:::
