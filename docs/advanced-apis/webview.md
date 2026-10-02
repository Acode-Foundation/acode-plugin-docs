# WebView

The `webview` module exposes Acode's native WebView API. Require it with `acode.require('webview')` to display web content in a fullscreen view or run a headless (hidden) WebView in the background, and communicate with the loaded page over a two-way messaging bridge.

Verified against Acode **v1.13.5** (versionCode `1011`): `src/lib/webview.js` (the module), `src/plugins/webview/www/webview.js` (the Cordova bridge) and `src/plugins/webview/src/android/com/foxdebug/webview/{WebViewPlugin,WebViewInstance,WebViewActivity}.java` (the native side). Registered in `src/lib/acode.js:440` as `this.define("webview", webview)`.

## Import

```js
const webview = acode.require('webview');
```

## API Overview

The module is a plain object with exactly **one** member:

- `create(options)`: Creates a new WebView instance. Returns `Promise<WebView>`.

There are no module-level singletons, no `close()`, no `get()` and no event emitter on the module itself. All state lives on the returned instance.

Each instance exposes these methods (all of them `async` except `onMessage`, `offMessage`, `on` and `off`):

| Member | Signature | Returns |
| --- | --- | --- |
| `id` | `string` | Native instance id, `wv_` + the first 12 hex characters of a UUID (`wv_1a2b3c4d5e6f`). |
| `options` | `object` | The options object you passed to `create()`, verbatim. |
| `loadURL(url)` | `(url: string) => Promise<void>` | — |
| `loadHTML(html)` | `(html: string) => Promise<void>` | — |
| `evaluate(js)` | `(js: string) => Promise<unknown>` | The value of the expression, JSON-decoded. |
| `postMessage(message)` | `(message: unknown) => Promise<void>` | — |
| `onMessage(callback)` | `(callback: (message: unknown) => void) => void` | — |
| `offMessage(callback)` | `(callback: (message: unknown) => void) => void` | — |
| `on(event, callback)` | `(event: string, callback: (event: string, data: object \| undefined) => void) => void` | — |
| `off(event, callback)` | `(event: string, callback: Function) => void` | — |
| `show()` | `() => Promise<void>` | — |
| `hide()` | `() => Promise<void>` | — |
| `reload()` | `() => Promise<void>` | — |
| `destroy()` | `() => Promise<void>` | — |

::: danger Always call `destroy()` once the WebView is no longer required
Every instance holds a native WebView, so leaving instances alive leaks memory and keeps pages (and their scripts/timers/network activity) running in the background. Instances are **not** tied to your plugin's lifecycle — Acode only force-destroys them when the whole Cordova plugin is torn down (`WebViewPlugin.onDestroy()`), which is process teardown, not plugin unload. Destroy them in `acode.setPluginUnmount(id, ...)`.

Calling `destroy()` **twice** throws `WebView has been destroyed` (there is no idempotence guard on the JS side).
:::

> [!Note]
> After an instance is destroyed — by `destroy()` or by the user closing a fullscreen WebView — calling `loadURL`, `loadHTML`, `evaluate`, `postMessage`, `show`, `hide`, `reload`, `destroy`, `onMessage` or `on` throws `WebView has been destroyed`. `offMessage()` and `off()` are the exceptions: they do not check the destroyed flag and simply filter their (already emptied) lists.

## Create

```js
// Fullscreen WebView shown immediately
const view = await webview.create({
  mode: 'fullscreen',
  title: 'My Page',
});
await view.loadURL('https://example.com');

// Hidden (headless) WebView running in the background
const headless = await webview.create({ mode: 'hidden' });
await headless.loadURL('https://example.com');
const title = await headless.evaluate('document.title');

// Fullscreen, but only shown when you call show()
const deferred = await webview.create({ mode: 'fullscreen', visible: false });
await deferred.loadURL('https://example.com');
await deferred.show();
```

`create()` is synchronous until it reaches the native bridge, so it **throws synchronously** (not a rejected promise) on a bad mode:

```
Unsupported WebView mode: "<mode>". Use "fullscreen" or "hidden".
```

### WebViewOptions

Only these five options are read. Anything else you pass is ignored by the native side (it is still readable on `instance.options`):

- `mode`: `'fullscreen'` or `'hidden'` (default `'hidden'`). Fullscreen hosts the WebView in its own Android activity; hidden creates a headless WebView that is created immediately and never displayed.
- `title`: Set as the hosting activity's title. Only applied when non-empty.
- `allowNavigation`: Boolean, default `true`. When `false`, every **page-initiated** navigation is blocked. It does **not** affect `loadURL()` / `loadHTML()`, which call `WebView.loadUrl()` / `loadDataWithBaseURL()` directly and therefore bypass `shouldOverrideUrlLoading()` entirely.
- `allowDownloads`: Boolean, default `false`. When `true`, a `DownloadListener` is installed. Each download shows a confirm dialog and is then saved by the system `DownloadManager` into the public Downloads directory, with the WebView's cookies forwarded. Non-`http(s)` download URLs are refused with a toast.
- `visible`: Boolean, default `true`. Only meaningful for `mode: 'fullscreen'`: when `false`, the hosting activity launch is deferred until you call `show()`.

### Return Value

`create()` resolves to a `WebView` instance whose only own data properties are `id`, `options`, `_messageCallbacks`, `_eventCallbacks`, `_destroyed` and `_destroyPromise`. Treat everything except `id` as internal.

## Manage

```js
// Load content
await view.loadURL('https://example.com');
await view.loadHTML('<h1>Hello from my plugin</h1>');

// Run JavaScript in the page and get the result
const title = await view.evaluate('document.title');

// Reload and destroy
await view.reload();
await view.destroy();
```

`evaluate()` results go through `JSONTokener`, so a string expression comes back as a JS string (quotes stripped, escapes intact) and a missing value comes back as `null`.

> [!Note]
> `show()` on a `mode: 'hidden'` instance **rejects** with `Hidden WebViews cannot be shown; use mode "fullscreen" to display content`. `hide()` on a hidden instance resolves as a no-op, because it is already hidden.

## Messaging

The plugin and the page can exchange messages over a two-way bridge. A `window.webview` object is injected into every loaded page:

```js
// Inside the page (your HTML or website scripts)
window.webview.onMessage((msg) => {
  console.log('from plugin:', msg);
});
window.webview.postMessage({ hello: 'world' });
```

```js
// In your plugin
view.onMessage((msg) => {
  console.log('from page:', msg); // { hello: 'world' }
});
await view.postMessage({ fromPlugin: true });
```

- Messages can be strings or any JSON-serializable value. `postMessage()` on the plugin side stringifies non-strings before crossing the bridge; on the page side `postMessage()` stringifies and then calls the native interface with `String(data)`. The receiving end tries `JSON.parse` first and falls back to the raw string, so a plain string arrives as a string **unless it happens to look like JSON**.
- The bridge is injected twice per navigation — best-effort on `onPageStarted` (before page scripts in most cases) and guaranteed on `onPageFinished`. Injection is guarded by `window.webview.__acodeBridge`, so callbacks registered between the two injections survive.
- The page-side object has exactly `onMessage(cb)`, `offMessage(cb)`, `postMessage(msg)` (plus the internal `__acodeBridge` flag and `_dispatch(msg)` helper).
- Use `offMessage(callback)` on either side to unsubscribe. On the plugin side it filters by reference identity.
- `onMessage(cb)` and `on(event, cb)` silently ignore a non-function argument.

::: warning A numeric-looking string arrives as a number
Because both ends try `JSON.parse` first, `view.postMessage('123')` reaches the page as the **number** `123`, and a page calling `window.webview.postMessage('true')` reaches your plugin as the **boolean** `true`. Wrap non-JSON payloads in an object (`{ type: 'text', value: '123' }`) when the type matters.
:::

> [!Note]
> Fullscreen instances create the native WebView lazily, inside the hosting activity. Until it exists, `postMessage()`, `evaluate()` and `reload()` reject with `WebView is not ready`, while `loadURL()` and `loadHTML()` are queued in `pendingUrl` / `pendingHtml` and applied the moment the WebView is created. Hidden instances create their WebView immediately, so they never hit this.

## Events

Listen for lifecycle events with `on(event, callback)`. The callback receives `(event, data)`:

```js
view.on('pageFinished', (event, data) => {
  console.log('Loaded:', data.url, data.title);
});

view.on('titleChanged', (event, data) => {
  console.log('New title:', data.title);
});

view.on('closed', () => {
  console.log('WebView was closed');
});
```

| Event | `data` | Raised when |
| --- | --- | --- |
| `pageFinished` | `{ url, title }` (empty strings when the native getters return `null`) | The page finished loading. |
| `titleChanged` | `{ title }` | `WebChromeClient.onReceivedTitle` fired. |
| `closed` | `undefined` | The hosting activity was destroyed — the user pressed back with no history left, or removed the task. |

- Only these three event names are ever emitted. `on()` accepts any string but nothing else will fire.
- On `closed`, the instance is marked destroyed and dropped from the JS instance map, and **all** message and event callbacks are cleared.
- `WebViewActivity.onDestroy()` fires `closed` **after** it has already destroyed the instance natively — so by the time your callback runs, the WebView is gone.
- Use `off(event, callback)` to remove a listener (matched on both event name and callback identity).

## Behavior & Lifecycle

- Modes: `fullscreen` hosts the WebView in its own activity; `hidden` is headless and never displayed, useful for background automation or scraping.
- Back button: in fullscreen mode `WebViewActivity.onBackPressed()` calls `webView.goBack()` while there is history; when there is none, the activity finishes, which destroys the instance and fires `closed`.
- Hide/Show: `hide()` calls `moveTaskToBack(true)` on the hosting activity, so nothing is destroyed and `show()` re-launches it with `FLAG_ACTIVITY_REORDER_TO_FRONT`. `show()` is therefore also the way to bring an instance that was backgrounded by the user back to the front.
- Show on an already-visible fullscreen instance is harmless: it re-launches the same activity with `REORDER_TO_FRONT` rather than creating a second WebView, and `createWebView()` is idempotent.
- Activity recreation (rotation, locale change) reuses the existing native WebView rather than leaking a new one.
- Cleanup: instances are not tied to your plugin's lifecycle. Destroy every instance you create — ideally in `acode.setPluginUnmount()` — so hidden WebViews don't outlive the plugin.

### Relationship with the Action Stack <Badge type="tip" text="new" />

A fullscreen WebView lives in a **separate Android activity**, so it does not participate in Acode's JavaScript action stack at all. `acode.require("actionStack")` entries are untouched by showing a WebView, and the Android back button inside the WebView activity is handled by `WebViewActivity.onBackPressed()`, never by `actionStack.pop()`. `hide()` moving the task to the back is likewise invisible to the action stack.

::: tip Pair them yourself when you need back navigation
Push your own action-stack entry so that, after `hide()`, Acode's back button returns to your page instead of exiting the app:

```js
const actionStack = acode.require('actionStack');

actionStack.push({
  id: 'my-plugin-browser',
  action() {
    view.hide();          // task goes to the back, page state preserved
  },
});
```

The WebView is not registered for you, so `actionStack.remove('my-plugin-browser')` is also yours to do when you `destroy()` it.
:::

### Relationship with the browser plugin

`webview` has nothing to do with `cordova-plugin-browser` or the Custom Tabs plugin. Those are separate Cordova plugins that Acode uses internally (`src/lib/customTab.ts`, `src/plugins/browser/**`, `src/plugins/custom-tabs/**`); none of them is registered through `Acode#define`, so `acode.require("browser")` and `acode.require("customTab")` are both `undefined`. If you need an in-app browser inside a plugin page, use `acode.require("webview")` with `mode: "fullscreen"`.

### Security <Badge type="tip" text="new" />

Everything below is enforced natively in `WebViewInstance.java`, not in JavaScript, so it applies no matter what the page does.

| Control | Implementation |
| --- | --- |
| Only `http(s)` may load | `sanitizeUrl()` rejects any URL whose `scheme://` prefix is not `http` or `https` with `Blocked URL: only http:// and https:// URLs are allowed`. Input without a `scheme://` prefix is treated as a host and loaded as `https://<input>`. |
| Only `http(s)` may navigate | `shouldOverrideUrlLoading()` blocks everything when `allowNavigation` is `false`, and otherwise blocks any target whose scheme is not `http`/`https` — so `file:`, `content:`, `intent:`, `javascript:`, `tel:` and scheme-less targets are refused. This hook only sees page-initiated navigations. |
| No file or content access | `setAllowFileAccess(false)`, `setAllowContentAccess(false)`, `setAllowFileAccessFromFileURLs(false)`, `setAllowUniversalAccessFromFileURLs(false)`. |
| JavaScript and DOM storage | `setJavaScriptEnabled(true)` and `setDomStorageEnabled(true)` — the page is fully scriptable by design, since `evaluate()` and the message bridge depend on it. |
| Plugin-to-page messages are injection-safe | `postMessage()` wraps the payload in `JSONObject.quote()` before evaluating it, so a hostile string cannot break out of the JS string literal. |
| Downloads | Opt-in via `allowDownloads`, http(s) only, user-confirmed per file. |

::: warning `window.AcodeWebViewNative` is always present on the page
The native JavaScript interface is added unconditionally (`addJavascriptInterface(new JsBridge(), "AcodeWebViewNative")`) and exposes a single `postMessage(String)`. `window.webview` is only a convenience wrapper around it, and any script in the page — including one you did not write — can call the raw interface. Treat everything you send through the bridge as visible to the page, and do not put secrets in it. The reverse direction is contained by the native side: the page cannot invoke plugin methods, only post a message.
:::

::: warning `loadHTML()` gives your page an opaque origin
`loadHTML()` uses `loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)`, so the document origin is `null`. Relative URLs resolve against nothing, `localStorage`/`indexedDB` are unavailable or partitioned per-load, and `fetch()` to a same-origin API will fail the same-origin check. If you need storage or a real origin, serve the page over `http(s)` and use `loadURL()`.
:::

## Example: two-way bridge

```js
const webview = acode.require('webview');

const view = await webview.create({
  mode: 'fullscreen',
  title: 'My Plugin Console',
  allowNavigation: false,
});

view.onMessage((msg) => {
  if (!msg || typeof msg !== 'object') return;

  switch (msg.type) {
    case 'ready':
      // The page booted and the bridge is installed.
      view.postMessage({ type: 'config', theme: 'dark', features: ['logs'] });
      break;

    case 'log':
      console.log('[page]', msg.level, msg.message);
      break;

    case 'run':
      // Never trust the page: `code` arrives from remote content.
      handleRemoteCode(String(msg.code ?? ''));
      break;

    default:
      console.warn('unknown message', msg);
  }
});

view.on('pageFinished', (_event, data) => {
  console.log('loaded', data.url, data.title);
});

view.on('closed', () => {
  console.log('closed by the user');
});

await view.loadHTML(`
<!doctype html>
<meta charset="utf-8">
<button onclick="run()">Run</button>
<script>
  // Plugin → page
  window.webview.onMessage(function (msg) {
    if (msg && msg.type === 'config') {
      document.documentElement.dataset.theme = msg.theme;
      window.available = msg.features || [];
    }
  });

  // Page → plugin
  function send(type, payload) {
    window.webview.postMessage(Object.assign({ type: type }, payload || {}));
  }

  function run() {
    if (!window.available || window.available.indexOf('logs') === -1) return;
    send('log', { level: 'info', message: 'button pressed' });
    send('run', { code: 'console.log("hi")' });
  }

  window.addEventListener('DOMContentLoaded', function () {
    send('ready');
  });
</script>
`);

async function handleRemoteCode(code) {
  // Never eval() remote content. Open it as an unsaved tab instead.
  const EditorFile = acode.require('EditorFile');
  new EditorFile('from-webview.js', {
    text: code,
    isUnsaved: true,
    render: true,
  });
}

// Always clean up.
acode.setPluginUnmount('com.example.plugin', async () => {
  await view.destroy();
});
```

## Example: Headless Title Fetcher

```js
const webview = acode.require('webview');

const view = await webview.create({ mode: 'hidden' });

view.onMessage((msg) => {
  if (msg.type === 'title') {
    console.log('Page title:', msg.title);
    view.destroy();
  }
});

await view.loadHTML(`
  <script>
    window.webview.postMessage({ type: 'title', title: document.title || 'untitled' });
  </script>
`);
```
