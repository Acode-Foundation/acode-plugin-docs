# Intent

The Intent API provides functionality to handle intents from other apps and implement custom URI scheme handling in Acode plugins.

Verified against Acode **v1.13.5** (versionCode `1011`): `src/handlers/intent.js` in full, the module wrapper in `src/lib/acode.js` (line 394), the native intent JSON in `src/plugins/system/android/com/foxdebug/system/System.java` (`getIntentJson`), the manifest in `config.xml`, and the in-app consumer `src/pages/plugin/plugin.js`.

## Overview

The Intent API allows plugins to:
- Handle `acode://` deep links that Acode dispatches as intents
- React to custom URI schemes in the format `acode://<module>/<action>/<value>`
- Suppress or short-circuit Acode's own handling with `preventDefault()` / `stopPropagation()`
- Enable deep linking between applications

For example, you could:
- Deep-link into your plugin's own screens (`acode://myplugin/search/query`)
- React to Acode's built-in deep links (`acode://plugin/install/<id>`)
- Skip Acode's default behaviour when you want to handle a link yourself

::: warning Compatibility note
`intent` is only present when the running Acode version exports it. Check before use:

```js
const intent = acode.require('intent');
if (!intent?.addHandler) {
  // Older Acode without the intent module.
}
```
:::

::: danger This API is **not** for shared files
A file opened from a file manager, or shared from another app, **never reaches your intent handler.** See [What actually gets dispatched](#what-actually-gets-dispatched). Only `acode://` URLs produce an `IntentEvent`.
:::

## Usage

### Importing the API

```js
const intent = acode.require('intent');
```

The module has exactly two members, defined in `src/lib/acode.js`:

```js
const intent = {
  addHandler: addIntentHandler,
  removeHandler: removeIntentHandler,
};
```

### Methods

#### addHandler

Appends a handler to a single module-level array.

```ts
addHandler(handler: (event: IntentEvent) => void | Promise<void>): void
```

- **Parameters:** `handler` — a function receiving the `IntentEvent`.
- **Returns:** `undefined`. Nothing is validated; a non-function value is pushed and will throw when the intent arrives.
- **Order:** handlers run in registration order, oldest first.
- **Removal:** you must keep a reference to the exact function you passed, because `removeHandler` compares by identity (`handlers.indexOf(handler)`).

#### removeHandler

Removes the **first** matching handler.

```ts
removeHandler(handler: (event: IntentEvent) => void): void
```

- **Returns:** `undefined`. Removing a handler that was never added is a silent no-op — it does not throw.
- Registering the same function twice and calling `removeHandler` once leaves one registration behind.

```js
const handler = (event) => { /* ... */ };
intent.addHandler(handler);
intent.removeHandler(handler);
```

### The IntentEvent Object

A fresh `IntentEvent` class instance is created per intent and shared by every handler in that dispatch.

| Member | Type | Description |
| --- | --- | --- |
| `module` | `string` | First path segment of the `acode://` URL. `undefined` when the URL had fewer segments. |
| `action` | `string` | Second path segment. `undefined` when absent. |
| `value` | `string` | Third path segment. `undefined` when absent. |
| `preventDefault()` | method | Marks the event default-prevented. Acode then skips **all** of its own built-in handling for this intent. |
| `stopPropagation()` | method | Stops the dispatch loop — handlers registered after yours never run for this intent. |
| `defaultPrevented` | getter | `boolean`, read-only. |
| `propagationStopped` | getter | `boolean`, read-only. |

::: warning `value` is the raw third segment only — and it is never decoded
Parsing is literally (`src/handlers/intent.js:32-33`):

```js
const path = url.replace("acode://", "");
const [module, action, value] = path.split("/");
```

Three consequences:

1. **Everything after the third `/` is discarded.** Destructuring stops at the
   third name, so `acode://myplugin/open/a/b/c` gives `value === "a"`. There is
   no `join`, no remainder, nothing — a **raw multi-slash URI can never survive**.
2. **There is no URL-decoding, anywhere.** `%20` stays `%20`, and a `+` stays `+`.
   Neither `src/handlers/intent.js` nor the native `getIntentJson`
   (`System.java:2038` passes `intent.getDataString()` through verbatim) calls
   `decodeURIComponent`. Decoding is **the plugin's job**.
3. **Query strings and fragments are part of `value`.** `acode://myplugin/search/hello%20world`
   arrives as the literal string `hello%20world`.

So the two cases behave like this:

| Link as delivered | `event.value` | What you must do |
| --- | --- | --- |
| `acode://myplugin/open/file%3A%2F%2F%2Fa%2Fb.txt` | `file%3A%2F%2F%2Fa%2Fb.txt` | `decodeURIComponent(value)` → `file:///a/b.txt` — **the only form that works** |
| `acode://myplugin/open/file:///a/b.txt` | `file:` | Nothing — the path is already gone. This link cannot work. |

`url.replace("acode://", "")` replaces only the first occurrence, so a nested `acode://` later in the string is preserved.
:::

::: danger Always build the value as one encoded segment
There is no raw multi-slash form to fall back on. Construct the link as `` `acode://${module}/${action}/${encodeURIComponent(value)}` `` and decode with `decodeURIComponent(value)` in the handler.

Guard the decode — `decodeURIComponent` **throws** `URIError` on a malformed escape such as a lone `%`, and neither the dispatch loop (`intent.js:41-45`) nor your own caller catches it.
:::

::: danger `preventDefault()` is ignored inside an async handler
Handlers are invoked like this:

```js
for (const handler of handlers) {
  handler(event);
  if (event.defaultPrevented) defaultPrevented = true;
  if (event.propagationStopped) break;
}
```

`handler(event)` is called **without `await`**, and the loop inspects the flags immediately afterwards. If your handler is `async` and calls `event.preventDefault()` after an `await`, the flag is set too late: Acode has already decided not to suppress its default handling and has already run your later handlers. Call `preventDefault()` / `stopPropagation()` **synchronously**, before the first `await`.

An `async` handler is otherwise fine — Acode never awaits it and never catches its rejection, so **you** must handle your own errors.
:::

## What actually gets dispatched

Acode's `HandleIntent(intent)` only runs for the Android actions `VIEW`, `EDIT`, `SEND` and `SEND_MULTIPLE` (matched as the last dot-segment of `intent.action`, so `android.intent.action.SEND_MULTIPLE` becomes `SEND_MULTIPLE`).

### `acode://` URLs go to your handler

The URL is taken from `intent.fileUri || intent.data || intent.extras["android.intent.extra.STREAM"]`. If it starts with `acode://`, an `IntentEvent` is built and every registered handler is invoked.

| URI | `module` / `action` / `value` | Who handles it |
| --- | --- | --- |
| `acode://auth/callback/...` | — | **Never dispatched.** Reserved by the native layer (`System.isReservedAuthIntent`) and additionally short-circuited in `handlers/intent.js`. A code you can rely on being free. |
| `acode://plugin/install/<pluginId>` | `plugin` / `install` / `<pluginId>` | Acode opens its plugin details page. `value` must match `/^([a-z0-9.]+)$/` or nothing happens. Suppress it with `preventDefault()` to run your own install flow. |
| `acode://plugin/purchased/<pluginId>` | `plugin` / `purchased` / `<pluginId>` | Acode's plugin page already listens for this after a browser checkout (`src/pages/plugin/plugin.js`). |
| `acode://plugin/uninstall/<pluginId>` | `plugin` / `uninstall` / `<pluginId>` | Same — Acode's plugin page listens for this after an external refund flow. |
| `acode://pro/<anything>` | `pro` / `<anything>` / — | Acode refreshes `config.HAS_PRO` from the server and hides the banner. No other effect. |
| `acode://myplugin/<action>/<encoded value>` | `myplugin` / `<action>` / `<encoded value>` | **Yours.** Any module name is yours; nothing in Acode claims it. Build the third segment with `encodeURIComponent` — a raw multi-slash URI is truncated to `"file:"`. |

Acode's own built-in `plugin/install` and `pro` handling runs **only if no handler called `preventDefault()`** — the check is `if (defaultPrevented) return;` before both blocks.

::: tip Claim a module name Acode does not use
The reserved names are just `auth`, `plugin` and `pro`. A plugin-specific module such as `acode://myplugin/...` collides with nothing.
:::

### Everything else never reaches your handler

For any non-`acode://` URL, Acode does **not** build an `IntentEvent`. It filters `intent.uris` (or the URL) down to `content://` and `file://` entries, queues them, and opens them itself once files are restored and plugins have loaded:

```js
await openFile(uri, {
  mode: "single",
  render: true,
  persistInSession: false,
  external: true,
});
```

This is the path used by:
- `android.intent.action.VIEW` / `EDIT` with `file://` or `content://` data (the file manager)
- `android.intent.action.SEND` / `SEND_MULTIPLE`, including `EXTRA_STREAM` and `ClipData`

::: warning `event.module === 'file'` never happens
There is no `'file'` module and no `'open'` action in the intent API. A shared or opened file never produces an `IntentEvent` — it is opened by Acode before your code can see it, so you cannot intercept it here at all. To influence how a shared file opens, register a [file handler](./file-handlers.md) instead.
:::

::: warning Files may need a document plugin
With `external: true`, opening a `.pdf`, `.docx`, `.dotx`, `.xlsx`, `.xls`, `.ods`, `.pptx`, `.ppsx` or `.potx` without a registered document handler throws:

```
Error: Document handler unavailable
code: "DOCUMENT_HANDLER_UNAVAILABLE"
```

Acode batches those failures and shows a dialog offering to open the Plugins page. This is the error path an earlier version of this page attributed to `openFile`; it lives in `src/lib/openFile.js` and is not something a plugin can suppress.
:::

### When handlers are registered

Intent delivery waits for both startup phases. `processPendingIntents()` returns early until `sessionStorage.isfilesRestored === "true"` **and** `isInitialPluginLoadComplete()`. Registered file intents are queued in `pendingIntents` and drained one batch at a time.

The `acode://` dispatch itself is **not** queued: `HandleIntent` runs handlers immediately, including very early in startup, before your plugin may have registered anything.

::: warning Register your handler as early as possible
`src/main.js` installs the native handler with `system.setIntentHandler(...)` and then calls `system.getCordovaIntent(...)` to replay the launch intent. If your `main.js` has not run `intent.addHandler(...)` by then, a cold-start deep link is simply lost. Register at the top level of `main.js`, not inside `acode.setPluginInit` or a `DOMContentLoaded` handler.
:::

## Opening files from an intent handler

::: danger `editorManager.openFile()` does not exist
Earlier versions of this page showed `editorManager.openFile(event.value)`. **There is no such method.** The exported `editorManager` object is defined at `src/lib/editorManager.js:3164` and exposes `getFile`, `switchFile`, `addFile`, `splitPane`, `revealRange`, `openPreviousEditorFromHistory` and so on — `openFile` is not among them. The `openFile` in that file is an internal import from `src/lib/openFile.js` and is **not** exposed to plugins:

```js
// src/lib/editorManager.js:102 — internal only
import openFile from "lib/openFile";
```

Calling it throws `TypeError: editorManager.openFile is not a function`.
:::

`acode.exec("open-file", ...)` is **not** a substitute either — `src/lib/commands.js:435` implements it as *open the file browser picker*:

```js
async "open-file"() {
  editorManager.editor.contentDOM.blur();
  const FileBrowser = await loadFileBrowser();
  FileBrowser("file").then(FileBrowser.openFile).catch(FileBrowser.openFileError);
}
```

### Use `EditorFile` <Badge type="tip" text="corrected" />

`acode.require("EditorFile")` is the supported way to open a path from a plugin. Constructing it registers the file with the editor; `load()` fills the session (reusing an in-flight load), and `render()` makes it active.

```js
const EditorFile = acode.require('EditorFile');

async function openPath(uri) {
  // Already open? Just focus the existing tab.
  const existing = window.editorManager?.getFile(uri, 'uri');
  if (existing) {
    existing.makeActive();
    return existing;
  }

  // `uri` is already decoded, so decode nothing a second time — a basename
  // containing a literal "%" would make decodeURIComponent throw URIError.
  const name = uri.split('/').pop() || 'untitled.txt';
  const file = new EditorFile(name, {
    uri,
    render: true,
  });

  await file.load();
  return file;
}
```

Pass this a **decoded** URI. `event.value` arrives exactly as it sat in the deep link, so a link built the correct way —
`acode://myplugin/open/file%3A%2F%2F%2Fa%2Fb.txt` — needs `decodeURIComponent(event.value)` first. A raw
`acode://myplugin/open/file:///a/b.txt` cannot work at all: the parser stops at the third `/`, so `value` is just `"file:"`.

`new EditorFile(filename, options)` accepts `uri`, `text`, `isUnsaved`, `mode`, `encoding`, `cursorPos`, `render`, `onsave`, `readOnly`, `paneId` and `persistInSession` in its options object. `acode.newEditorFile(filename, options)` is a convenience wrapper but **returns `undefined`**, so use `new EditorFile(...)` when you need the instance.

::: tip `EditorFile` does not validate the URI
Unlike `lib/openFile.js`, constructing an `EditorFile` does not call `fs.stat()` first. A bad `uri` surfaces later, from `load()` (a rejected promise) or from `saveFile`. Null-check `uri` yourself, and use `acode.require("fs")` first if you need to confirm the path exists.
:::

## Examples

Basic intent handling:

```js
const intent = acode.require('intent');

const handler = (event) => {
  const { module, action, value } = event;

  // Optional: prevent default behavior
  // event.preventDefault();

  // Optional: stop other handlers
  // event.stopPropagation();

  console.log(`Intent received: ${module}/${action}/${value}`);
};

// Register handler
intent.addHandler(handler);

// Later: remove handler if needed
intent.removeHandler(handler);
```

Custom URI scheme handler:

```js
const intent = acode.require('intent');

const pluginHandler = (event) => {
  if (event.module !== 'myplugin') return;

  // Synchronous: `preventDefault()` after an `await` is ignored by Acode.
  event.preventDefault();
  // Claim the intent so other plugins cannot also react to it.
  event.stopPropagation();

  // `value` is the RAW third path segment: it is NOT decoded, and anything
  // after a further "/" was already dropped. The link must have been built as
  // acode://myplugin/search/QUERY with encodeURIComponent(QUERY). The try/catch
  // is needed because decodeURIComponent THROWS on a malformed escape.
  let value = '';
  try {
    value = decodeURIComponent(event.value || '');
  } catch {
    return; // malformed percent-escape — nothing sensible to dispatch
  }

  switch (event.action) {
    case 'search':
      // acode://myplugin/search/QUERY
      performSearch(value);
      break;
    case 'create':
      // acode://myplugin/create/NAME
      createNewFile(value);
      break;
  }
};

intent.addHandler(pluginHandler);
```

Intercepting Acode's own install deep link:

```js
const intent = acode.require('intent');

function onInstallIntent(event) {
  if (event.module !== 'plugin' || event.action !== 'install') return;

  // Suppress Acode opening its plugin page, and run our own flow.
  event.preventDefault();

  const pluginId = event.value;
  myPlugin.installWithOwnUi(pluginId);
}

intent.addHandler(onInstallIntent);
```

## Complete runnable example <Badge type="tip" text="new" />

A plugin that owns the `myplugin` module: handles three deep links, opens files safely, and unregisters cleanly on unload. Plugins are loaded as **classic scripts**, so there are no `import` / `export` statements.

```js
const PLUGIN_ID = 'com.example.plugin';
const MODULE = 'myplugin';

const intent = acode.require('intent');
const EditorFile = acode.require('EditorFile');

// Only these actions are meaningful in an acode://myplugin/... deep link.
const ALLOWED = new Set(['search', 'open', 'create']);

// Acode hands you `value` exactly as it appeared in the URL, so decoding is
// your job — and decodeURIComponent THROWS on a malformed escape such as "%".
function decodeValue(value) {
  try {
    return decodeURIComponent(value || '');
  } catch (error) {
    acode.toast('Malformed deep link');
    return null;
  }
}

async function openPath(uri) {
  const existing = window.editorManager?.getFile(uri, 'uri');
  if (existing) {
    existing.makeActive();
    return existing;
  }

  // `uri` is already decoded, so split on the last "/" and decode nothing.
  const name = uri.split('/').pop() || 'untitled.txt';
  const file = new EditorFile(name, { uri, render: true });
  await file.load();
  return file;
}

// How to BUILD a link that will actually survive the parser:
//
//   encodeURIComponent('file:///sdcard/Acode/notes.md')
//     -> 'file%3A%2F%2F%2Fsdcard%2FAcode%2Fnotes.md'
//   acode://myplugin/open/file%3A%2F%2F%2Fsdcard%2FAcode%2Fnotes.md
//
// Only then is `value` the full URI, and decodeURIComponent(value) rebuilds it.
function buildLink(action, rawValue) {
  return `acode://${MODULE}/${action}/${encodeURIComponent(rawValue)}`;
}

function handleIntent(event) {
  // Ignore anything that is not ours — other plugins get their own chance.
  if (event.module !== MODULE) return;
  if (!ALLOWED.has(event.action)) return;

  // Both calls are synchronous. Do this BEFORE any await.
  event.preventDefault();
  event.stopPropagation();

  const value = decodeValue(event.value);
  if (value === null) return;

  try {
    switch (event.action) {
      case 'search':
        runSearch(value);
        break;

      case 'open':
        // acode://myplugin/open/<encodeURIComponent(uri)>
        // `value` is RAW, so decode it — and the link must have been built with
        // the URI in ONE percent-encoded segment. A raw
        // `acode://myplugin/open/file:///a/b.txt` arrives as just "file:".
        openPath(value).catch((error) => acode.toast(error.message));
        break;

      case 'create':
        createFile(value);
        break;
    }
  } catch (error) {
    // The dispatch loop calls `handler(event)` with no try/catch, so a throw
    // here escapes into Acode and aborts the remaining handlers.
    acode.toast(String(error && error.message));
  }
}

function runSearch(query) { /* your search */ }
function createFile(name) { /* your file creation */ }

// Register as early as possible: a cold-start deep link is dispatched before
// a deferred init would have run.
intent?.addHandler(handleIntent);

// Clean up on plugin unload / disable / update.
acode.setPluginUnmount(PLUGIN_ID, () => {
  intent?.removeHandler(handleIntent);
});
```

## Common Use Cases

1. **Deep-linking into your plugin**:
   - Own a module namespace (`acode://myplugin/...`) so nothing collides
   - Build every link as `` `acode://${module}/${action}/${encodeURIComponent(value)}` `` — the value must be **one** percent-encoded segment
   - Decode with `decodeURIComponent` in the handler (guarded — it throws on a malformed escape)

2. **Reacting to Acode's own deep links**:
   - `acode://plugin/install/<id>` — run your own install or upsell UI instead
   - `acode://plugin/purchased/<id>` and `acode://plugin/uninstall/<id>` — refresh your own licence UI

3. **Intercepting intents**:
   - Call `preventDefault()` synchronously to suppress Acode's built-in behaviour
   - Call `stopPropagation()` to stop other plugins from seeing the same link

## Gotchas <Badge type="tip" text="new" />

- **Only `acode://` URLs produce an `IntentEvent`.** Shared and opened files never do.
- **`preventDefault()` / `stopPropagation()` are ignored after an `await`.** The dispatch loop is synchronous.
- **Your handler's rejection is unhandled.** Acode does not `await` or `try/catch` it; wrap your own body.
- **`value` is capped at the third path segment and is not URL-decoded.** There is no raw multi-slash form: `acode://myplugin/open/file:///a/b.txt` arrives as `"file:"`. Encode the value with `encodeURIComponent` when you build the link.
- **`decodeURIComponent` throws `URIError`** on a malformed escape, and nothing in the intent pipeline catches it — wrap your own decode.
- **`removeHandler` removes only the first match** and compares by function identity — keep the reference.
- **Handlers registered after a cold-start deep link miss it.** Register at the top level of `main.js`.
- **`stopPropagation()` stops later handlers, not earlier ones.** An earlier handler may already have run.
- **`preventDefault()` suppresses all of Acode's built-in handling**, including `acode://plugin/install` and the `acode://pro` refresh — not just the part your plugin cares about.
- **`acode://auth/callback` never reaches you**, so it is safe to leave to the auth plugin.
- **There is no way to unregister all handlers.** `removeHandler` is the only removal API.

## Related APIs

- Shared / opened files: register a [File Handler](./file-handlers.md) — that is the hook for file intents, not this one
- Opening a path from a plugin: `EditorFile` + `load()` — see [Editor File](../editor-components/editor-file.md)