# Keyboard API

The Keyboard API provides functionality for handling keyboard events and managing keyboard state in Acode plugins. It allows you to detect keyboard visibility and react to the soft keyboard opening and closing.

::: info
Verified against Acode **v1.13.5**: `src/handlers/keyboard.js` (registered in `src/lib/acode.js` as `this.define("keyboard", keyboardHandler)`).
:::

## Usage

```js
const keyboard = acode.require('keyboard');
```

::: warning
`acode.require('keyboard')` returns the **`keyboardHandler` function itself**, not a plain object. The export is `export default function keyboardHandler(e) { … }`, so the module *is* the document-level `keydown` listener that Acode installs at `src/main.js:101`. The only members attached to it are `.on()` and `.off()`. There is no `addEventListener`, no `removeEventListener`, no `emit`, and no `key` emitter.
:::

## Events

The module declares five event names (`src/handlers/keyboard.js:16-22`), but only **four** are ever emitted in v1.13.5:

| Event | Emitted at | Meaning |
|---|---|---|
| `keyboardShowStart` | `keyboard.js:120` | Soft keyboard is starting to appear |
| `keyboardHideStart` | `keyboard.js:126` | Soft keyboard is starting to disappear |
| `keyboardHide` | `keyboard.js:148` | Soft keyboard finished hiding |
| `keyboardShow` | `keyboard.js:150` | Soft keyboard finished showing |
| `key` | — | **Never emitted.** The bucket exists in the event map (`keyboard.js:17`) but `emit("key")` is not called anywhere in the source tree |

::: danger
`emit()` invokes listeners as `cb()` — **with no arguments** (`src/handlers/keyboard.js:186`):

```js
function emit(eventName) {
		if (!event[eventName]) return;
		event[eventName].forEach((cb) => cb());
}
```

So `keyboard.on('keyboardShow', (state) => …)` receives `undefined`. No event object, no height, no flags. Anything you need must be read from `window.innerHeight` / `window.innerWidth` inside the callback.
:::

### How the soft keyboard is detected

The `keyboard*` events are derived from window geometry, not from a keyboard API:

1. Acode wires `window.addEventListener("resize", windowResize)` (`src/main.js:98`).
2. `windowResize` fires `resizeStart` immediately, then `resize` after a **100 ms** idle debounce (`src/handlers/windowResize.js:28-33`).
3. On `resizeStart`, the handler reads `getSystemConfiguration()` from the native `System` Cordova plugin (`src/lib/systemConfiguration.js:50`) and compares `keyboardHeight` against `MIN_KEYBOARD_HEIGHT`. That threshold starts at `100` and is raised to `bannerAdHeight + 10` once an `admob.banner.size` event arrives (`keyboard.js:15`, `keyboard.js:104-107`).
4. Everything is gated on there being **no external keyboard**: `hardKeyboardHidden === HARDKEYBOARDHIDDEN_NO` (which is `1`, `systemConfiguration.js:1`).

Consequences worth knowing:

- If a Bluetooth/USB keyboard is attached, **none** of the four events fire.
- `keyboardShow` / `keyboardHide` additionally require `softKeyboardHeight` to be truthy (`keyboard.js:143`), which is only set on a `resizeStart` where the height *decreased*.
- `keyboardShowStart` / `keyboardHideStart` only fire on the *direction* of the height change; `keyboardHide` / `keyboardShow` fire on the settled geometry.
- A split/floating keyboard that does not shrink the window is undetectable — the source comments this explicitly (`windowResize.js:18-19`).

## Methods

### on(eventName, callback)

Add an event listener for keyboard events.

```js
keyboard.on('keyboardShow', () => {
		// Handle keyboard show
		console.log('Keyboard is now visible');
});
```

Parameters:
- `eventName` (string) - Name of the event to listen for (`'keyboardShowStart'`, `'keyboardHideStart'`, `'keyboardShow'`, `'keyboardHide'`, or the inert `'key'`)
- `callback` (Function) - Function to execute when the event occurs. It is called with **no arguments**.

An unknown `eventName` is silently ignored — the guard is `if (!event[eventName]) return;` (`keyboard.js:164`). Registering the same function twice registers it twice, because `on()` only pushes onto the array (`keyboard.js:165`).

### off(eventName, callback)

Remove an event listener.

```js
const keyboardCallback = () => {
		console.log('Keyboard shown');
};

// Add listener
keyboard.on('keyboardShow', keyboardCallback);

// Remove listener
keyboard.off('keyboardShow', keyboardCallback);
```

Parameters:
- `eventName` (string) - Name of the event to remove the listener from
- `callback` (Function) - **The same function reference** that was passed to `on()`

`off()` filters by strict identity (`keyboard.js:176`), so an inline arrow function can never be removed — keep a reference. There is no `once()`, no "remove all", and no return value from either method.

### Escape key state — `escKey` is **not** exposed

::: danger
Earlier versions of this page documented a `keyboard.escKey` property. **It does not exist in v1.13.5.** The Escape state lives in a separate named export, `keydownState` (`src/handlers/keyboard.js:30-50`), and that object is *not* reachable through `acode.require("keyboard")` — `acode.js:433` registers only the default export. `keydownState` is consumed internally by `src/main.js:985` (to swallow the Android Back button after Escape) and `src/lib/editorManager.js:4474`.

The only public way to see an Escape press is your own DOM listener:

```js
document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
				console.log('Escape key is pressed');
		}
});
```
:::

## Key events and the payload shape

Because `key` is never emitted, **there is no key payload from this module**. To observe hardware keys, subscribe to the DOM directly — the object you get is a normal `KeyboardEvent`:

```js
document.addEventListener('keydown', (event) => {
		// event.key, event.code, event.keyCode, event.which
		// event.ctrlKey / shiftKey / altKey / metaKey
		// event.target, event.repeat, event.location
		// event.preventDefault() / event.stopPropagation()
});
```

Acode itself already installs one such listener (`src/main.js:101` → `keyboardHandler`) whose only job is to **forward** modifier combos into CodeMirror. From `keyboard.js:56-83` the exact policy is:

1. If the target is an `<input>`, `<textarea>`, `<select>`, `contentEditable`, or inside `.prompt` / `#palette`, the combo is left alone — return early (`keyboard.js:91-101`).
2. If no modifier is held (`ctrlKey`/`shiftKey`/`altKey`/`metaKey` all false), return (`keyboard.js:65`).
3. If the pressed key *is* a bare modifier (`Control`, `Alt`, `Meta`, `Shift`), return (`keyboard.js:66`).
4. If there is no active CodeMirror `contentDOM`, return (`keyboard.js:68-69`).
5. If the event already came from inside the editor, return — never re-dispatch (`keyboard.js:73`).
6. Otherwise synthesise a `keydown` with `createKeyboardEvent` and dispatch it on the editor's `contentDOM` (`keyboard.js:75-82`).

### Consuming keys without breaking normal editing

::: tip
Prefer `acode.require("commands").addCommand({ bindKey })` over a raw `keydown` listener. Acode stores bindings in the global `KEYBINDING_FILE` (`DATA_STORAGE/.key-bindings.json`), applies them through `refreshCommandKeymap(view)` (`src/cm/commandRegistry.js:1772`), and `normalizeExternalKey` (`commandRegistry.js:1815`) accepts either a single combo string or `{ win, linux, mac }`. You get palette listing, conflict detection and a toast when the user changes them — for free.
:::

If you must listen manually, mirror the policy above:

- Bind to `keydown` on `document` (or `window`) and **do not** call `preventDefault()` unless you actually consume the combo, or you will break text editing and CodeMirror commands.
- Skip the event when `event.target` is an input, textarea, select, contentEditable, or inside `.prompt` / `#palette` — that is exactly Acode's own `shouldIgnoreEditorShortcutTarget` check.
- Skip when the event already came from `editorManager.editor.contentDOM` or one of its descendants, otherwise you and Acode both forward it and the command runs twice.
- Skip bare modifier keydowns (`event.key` in `['Control', 'Alt', 'Meta', 'Shift']`).
- Always `off()` on unmount — see [`acode.setPluginUnmount`](../global-apis/acode.md#setpluginunmount-pluginid-string-unmount-function) and the `off()` note above.

## Example Plugin

Here's a complete example of using the keyboard API in an Acode plugin:

```js
class KeyboardPlugin {
		constructor() {
				this.keyboard = acode.require('keyboard');
				this._onShow = this._onShow.bind(this);
				this._onHide = this._onHide.bind(this);
				this._onDocKeydown = this._onDocKeydown.bind(this);
		}

		_onShow() {
				// No payload is passed — read the geometry yourself.
				console.log('soft keyboard visible, innerHeight =', window.innerHeight);
		}

		_onHide() {
				console.log('soft keyboard hidden, innerHeight =', window.innerHeight);
		}

		_onDocKeydown(event) {
				// Mirror Acode's own ignore rules so we never steal typing.
				const $target = event.target;
				if ($target instanceof HTMLElement) {
						if (
							$target.isContentEditable ||
							$target.closest('.prompt, #palette') ||
							$target instanceof HTMLInputElement ||
							$target instanceof HTMLTextAreaElement ||
							$target instanceof HTMLSelectElement
						) {
								return;
						}
				}
				if (['Control', 'Alt', 'Meta', 'Shift'].includes(event.key)) return;

				// Ctrl+Alt+S → save. "save" is a real command key
				// (src/lib/commands.js:508), and Acode ignores events that
				// already originate inside the editor, so no double-run.
				if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') {
						acode.exec('save');
				}
		}

		mount() {
				this.keyboard.on('keyboardShow', this._onShow);
				this.keyboard.on('keyboardHide', this._onHide);
				document.addEventListener('keydown', this._onDocKeydown);
		}

		unmount() {
				this.keyboard.off('keyboardShow', this._onShow);
				this.keyboard.off('keyboardHide', this._onHide);
				document.removeEventListener('keydown', this._onDocKeydown);
		}
}

if (window.acode) {
		const keyboardPlugin = new KeyboardPlugin();
		acode.setPluginInit('keyboard-example', (baseUrl, $page) => {
				if (keyboardPlugin.mounted) return;
				keyboardPlugin.mounted = true;
				keyboardPlugin.mount();
		});
		// Always register the teardown — the editor calls it on unmount.
		acode.setPluginUnmount('keyboard-example', () => {
				keyboardPlugin.mounted = false;
				keyboardPlugin.unmount();
		});
}
```

This example demonstrates listening for keyboard visibility changes and implementing custom keyboard shortcuts in an Acode plugin.

## See also

- [`acode.require("createKeyboardEvent")`](./keyboard-event.md) — the factory Acode uses in step 6 above.
- [`acode.require("windowResize")`](./window-resize.md) — the underlying resize source.
- [`acode.require("commands")`](./commands.md) — bindable `bindKey` shortcuts.
