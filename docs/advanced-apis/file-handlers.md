# File Handlers API

Use this API to register custom open handlers for file extensions. A handler intercepts `openFile()` so your plugin — not the text editor — decides what happens.

## Where the API lives <Badge type="tip" text="new" />

| Access | Works? |
| --- | --- |
| `acode.registerFileHandler(id, options)` | ✅ |
| `acode.unregisterFileHandler(id)` | ✅ |
| `acode.require('fileTypeHandler')` | ❌ returns `undefined` |

`src/lib/acode.js` imports the registry as a private module and never calls `this.define(...)` for it, so the registry is **not** exposed through `acode.require()`. The two `acode.*` methods are the entire plugin-facing surface. `getFileHandler(filename)`, `getHandlers()` and the underlying `Map` are internal.

## `acode.registerFileHandler(id, options)`

Registers a handler.

```js
acode.registerFileHandler("com.example.svg-viewer", {
  extensions: ["svgx", ".svgalt"],
  handleFile: async (fileInfo) => {
    console.log(fileInfo.name, fileInfo.uri);
  },
});
```

| Argument | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique handler id. Re-using a registered id **throws** |
| `options.extensions` | `string[]` | Required, must be non-empty |
| `options.handleFile` | `Function` | Required. Must be a function |

These are the only two option keys that exist. Extra keys are silently ignored — there is no `icon`, `mimeType`, `priority`, `name` or `displayName` field, and the registry stores only `{extensions, handleFile}`.

### Extension normalization

```js
ext.toLowerCase().replace(/^\./, "")
```

Each entry is lowercased and has **one** leading dot removed. So `"svgx"`, `".svgx"` and `".SVGX"` all normalize to `"svgx"`. `"..svgx"` would normalize to `".svgx"` and never match.

Matching (`getFileHandler(filename)`) takes the **last** dot segment only:

```js
const ext = filename.split(".").pop().toLowerCase();
```

| Filename | Matched extension |
| --- | --- |
| `app.SVGX` | `svgx` |
| `button.test.ts` | `ts` |
| `.env` | `env` (a leading dot yields an empty first segment, so the dotfile *does* match) |

::: warning Last segment only — not longest match
`button.test.ts` matches a handler registered for `ts`, never one registered for `test.ts`. This is different from the icon-pack API, which does try the longest compound extension first.
:::

### `"*"` catch-all

A handler whose `extensions` contains `"*"` matches **every** filename:

```js
acode.registerFileHandler("com.example.vault", {
  extensions: ["*"],
  handleFile: async (fileInfo) => { /* ... */ },
});
```

## `handleFile(fileInfo)`

Called by `openFile()` with a single object:

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string` | File name from `fs.stat()`, falling back to the tab filename, then the URI |
| `uri` | `string` | Absolute file URL |
| `stats` | `object` | The result of `fsOperation(uri).stat()` |
| `readOnly` | `boolean` | `true` when `stats.canWrite === false` |
| `options.cursorPos` | `{row, column}` | Cursor from the original open request |
| `options.render` | `boolean` | Render hint from the original open request |
| `options.onsave` | `Function` | Save hook from the original open request |
| `options.encoding` | `string` | Encoding from the original open request |
| `options.mode` | `string` | Language mode from the original open request |
| `options.createEditor` | `(isUnsaved, text, detectedEncoding?) => void` | Escape hatch — build a normal editor tab from inside your handler |
| `options.signal` | `AbortSignal` | Aborted when the open request is superseded |

**Return value: none.** It is awaited purely for its side effects. Once it resolves, `openFile()` returns immediately and the normal text-editor, image, video and audio paths are **all skipped**.

::: tip Delegating to the editor
`options.createEditor(isUnsaved, text, detectedEncoding)` is the escape hatch, but **you must read the file yourself** — `text` is not supplied for you:

```js
const fs = acode.require('fs');
const encoding = acode.require('settings').value.defaultFileEncoding;
const text = await fs(uri).readFile(encoding);
options.createEditor(false, text, encoding);
```

Calling `options.createEditor(false)` without text creates an editor tab with no content. Delegating this way also skips `recents.addFile(uri)`.
:::

### When is it called?

`openFile()` runs the handler lookup right after `fs.stat()` and **before** any content-type branch:

```js
const customHandler = fileTypeHandler.getFileHandler(name);
...
if (customHandler) {
  try {
    await customHandler.handleFile({ name, uri, stats: fileInfo, readOnly, options: {...} });
    return;
  } catch (error) {
    console.error(`File handler '${customHandler.id}' failed:`, error);
    // non-external opens continue with the default handling
  }
}
```

Two important consequences:

- If the file is **already open**, `openFile()` returns early (promoting the existing tab) and your handler is **not** called.
- If `handleFile` **throws**, Acode logs `File handler '<id>' failed:` and **falls through to the default editor** — so a buggy handler degrades to a text tab rather than losing the file.

::: danger External intents
When `openFile()` is called with `{external: true}` (an Android file intent, e.g. tapping a `.pdf` in another app), a handler failure is **re-thrown** instead of falling back. For those extensions Acode also *requires* a handler: `.pdf`, `.docx`, `.dotx`, `.xlsx`, `.xls`, `.ods`, `.pptx`, `.ppsx` and `.potx` open with `DOCUMENT_HANDLER_UNAVAILABLE` when no handler matches.
:::

## `acode.unregisterFileHandler(id)`

Removes a handler. Unknown ids are ignored — the delete is unconditional, so it does not throw.

```js
acode.unregisterFileHandler("com.example.svg-viewer");
```

::: tip Clean up on unmount
Nothing unregisters file handlers automatically. Call `acode.unregisterFileHandler(id)` from `acode.setPluginUnmount(id, ...)` or the handler leaks into the next load of your plugin.
:::

## Priority and overrides <Badge type="tip" text="new" />

This is provable from the registry, and it is **first-registration-wins**:

- `getFileHandler()` iterates `this.#handlers` — a `Map`, so in insertion order — and returns the **first** handler whose `extensions` include the matched extension or `"*"`.
- Re-registering the same `id` throws `Handler with id '<id>' is already registered`. There is no "replace" path.
- `unregister()` + `register()` therefore **moves you to the end** of the queue, which can hand priority to another plugin.

So two plugins registering the same extension is a race won by whichever registered first; the loser's `handleFile` is simply never called.

## Notes

- Handler ids must be unique — duplicate registration throws.
- Extensions are normalized to lowercase with a single leading dot removed, and matched case-insensitively.
- `"*"` can be used to match any extension.
- Return nothing from `handleFile`. If you want a normal editor tab instead, read the file yourself and call `options.createEditor(false, text, encoding)`.

## Complete example: a custom viewer <Badge type="tip" text="new" />

```js
// main.js
if (window.acode) {
  const id = 'com.example.markdown-preview';
  const fs = acode.require('fs');
  const page = acode.require('page');
  const actionStack = acode.require('actionStack');
  const encoding = acode.require('settings').value.defaultFileEncoding;

  // Never inject raw file content into innerHTML.
  const escape = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  acode.registerFileHandler(id, {
    // Dots are allowed and normalized away
    extensions: ['mdx', '.md'],
    handleFile: async ({ name, uri, readOnly }) => {
      const source = await fs(uri).readFile(encoding);

      const preview = page(name.replace(/\.mdx?$/i, ''), {
        lead: tag('span', {
          className: 'icon arrow_back',
          onclick: () => preview.hide(),
        }),
      });

      preview.appendBody(tag('pre', { textContent: source }));
      if (readOnly) preview.appendBody(tag('small', { textContent: 'Read only' }));

      preview.onhide = () => actionStack.remove(`${id}-preview`);
      preview.on('show', () => preview.body.scrollTo(0, 0));

      preview.show = () => {
        if (preview.isConnected) return; // never push twice
        actionStack.push({ id: `${id}-preview`, action: preview.hide });
        app.append(preview);
      };

      preview.show();
    },
  });

  acode.setPluginUnmount(id, () => {
    acode.unregisterFileHandler(id);
  });
}
```

::: tip Pass `"*"` for an envelope handler
If your plugin should claim files only when it recognises them, register `extensions: ['*']` and delegate when it does not:

```js
const fs = acode.require('fs');
const encoding = acode.require('settings').value.defaultFileEncoding;

acode.registerFileHandler('com.example.picky', {
  extensions: ['*'],
  handleFile: async ({ uri, name, options }) => {
    if (!name.endsWith('.todo')) {
      const text = await fs(uri).readFile(encoding);
      options.createEditor(false, text, encoding);
      return;
    }
    // ... your viewer ...
  },
});
```

Because resolution is first-registration-wins, an envelope handler registered early will shadow every later handler. Prefer narrow extensions.
:::