# WebView

The `webview` module exposes Acode's native WebView API. Require it with `acode.require('webview')` to display web content in a fullscreen view or run a headless (hidden) WebView in the background, and communicate with the loaded page over a two-way messaging bridge.

## Import

```js
const webview = acode.require('webview');
```

## API Overview

The module exposes a single method:

- `create(options)`: Creates a new WebView instance. Resolves to a WebView instance object.

Each instance exposes these methods:

- `loadURL(url)`: Loads a URL. Only `http://` and `https://` URLs are allowed; input without a scheme (e.g. `example.com`) is loaded over `https`.
- `loadHTML(html)`: Loads an HTML string directly.
- `evaluate(js)`: Evaluates JavaScript in the page and resolves with the result.
- `postMessage(message)`: Sends a message to the page. Non-string values are JSON-stringified.
- `onMessage(callback)`: Registers a callback for messages sent from the page.
- `offMessage(callback)`: Removes a previously registered message callback.
- `on(event, callback)`: Registers a listener for lifecycle events (see Events).
- `off(event, callback)`: Removes a previously registered event listener.
- `show()`: Shows a fullscreen WebView (or brings it back to the front after `hide()`).
- `hide()`: Moves a fullscreen WebView to the background, keeping its page state intact.
- `reload()`: Reloads the current page.
- `destroy()`: Destroys the instance and releases its resources. **You must call this when the WebView is no longer needed.**

> [!Warning]
> Always call `destroy()` once the WebView is no longer required. Every instance holds a native WebView, so leaving instances alive leaks memory and keeps pages (and their scripts/timers/network activity) running in the background.

> [!Note]
> After an instance is destroyed (via `destroy()` or by the user closing a fullscreen WebView), calling any method on it throws `WebView has been destroyed`.

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

### WebViewOptions

Options accepted by `create()`:

- `mode`: `'fullscreen'` or `'hidden'` (default `'hidden'`). Fullscreen opens the WebView in its own activity; hidden creates a headless WebView that is never displayed.
- `title`: Title shown in the fullscreen activity.
- `allowNavigation`: Boolean, whether the page is allowed to navigate (default `true`). When `false`, all in-page navigation is blocked.
- `allowDownloads`: Boolean, enables downloads (default `false`). Downloads are confirmed with a dialog and saved via the system DownloadManager into the public Downloads directory.
- `visible`: Boolean, whether a fullscreen WebView is shown immediately (default `true`). When `false`, the launch is deferred until `show()` is called.

### Return Value

`create()` resolves to an instance object with:

- `id`: Unique id (e.g. `wv_1a2b3c4d5e6f`).
- Plus the instance methods listed in API Overview.

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

- Messages can be strings or any JSON-serializable value. JSON payloads are parsed automatically on both sides; anything else arrives as a raw string.
- The bridge is re-injected after every navigation, so `window.webview` is always available to the current page.
- Use `offMessage(callback)` on either side to unsubscribe.

> [!Note]
> Fullscreen instances create the native WebView lazily, so `postMessage()`, `evaluate()` and `reload()` reject with `WebView is not ready` until a page exists. `loadURL()` and `loadHTML()` called early are queued and applied once the WebView is created.

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

- `pageFinished`: A page finished loading. Data: `{ url, title }`.
- `titleChanged`: The page title changed. Data: `{ title }`.
- `closed`: A fullscreen WebView was closed by the user (back button/task removal). The instance is marked destroyed and further calls on it fail fast.

Use `off(event, callback)` to remove a listener.

## Behavior & Lifecycle

- Modes: `fullscreen` hosts the WebView in its own activity; `hidden` is headless and never displayed, useful for background automation or scraping.
- Back button: In fullscreen mode it navigates back through page history first; when nothing is left, the WebView closes and the `closed` event fires.
- Hide/Show: `hide()` backgrounds the fullscreen activity without destroying it, so `show()` restores it with the page state intact.
- Cleanup: Instances are not tied to your plugin's lifecycle. Destroy every instance you create — ideally in your plugin's `destroy()` function — so hidden WebViews don't outlive the plugin.
- Security: Hosted content is isolated. File and content scheme access is disabled, only `http(s)` URLs can load, and non-http(s) navigation (`file:`, `intent:`, `javascript:`, `tel:`, ...) is always blocked. When `allowNavigation` is `false`, all navigation is blocked.

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
