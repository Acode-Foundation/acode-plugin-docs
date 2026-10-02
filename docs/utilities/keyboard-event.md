# createKeyboardEvent

The `createKeyboardEvent` API allows you to programmatically create and dispatch keyboard events in Acode. This is useful for simulating keyboard interactions and testing keyboard-driven features.

::: info
Verified against Acode **v1.13.5**: `src/utils/keyboardEvent.js` (registered in `src/lib/acode.js` as `this.define("createKeyboardEvent", KeyboardEvent)`).
:::

## Import

```js
const createKeyboardEvent = acode.require('createKeyboardEvent');
```

## Usage

```js
// Create a keyboard event
const event = createKeyboardEvent('keydown', {
		key: 'Enter',
		ctrlKey: true
});

// Dispatch the event
document.dispatchEvent(event);
```

::: warning
`bubbles` defaults to **`false`** (`src/utils/keyboardEvent.js:88`), so an event dispatched on `document` will never reach a listener on the editor or on an input. Pass `bubbles: true` and dispatch on the element you want the event to reach.
:::

## API Reference

### createKeyboardEvent(type, dict)

Creates a new keyboard event with the specified type and options.

#### Parameters

- `type` (*string*) - The type of keyboard event to create. The JSDoc declares `'keydown' | 'keyup'` (`keyboardEvent.js:109`); the `KeyEvent` typedef also lists `'keypress'` (`keyboardEvent.js:3`). The value is passed straight through to `event.initKeyEvent(...)` / `event.initEvent(...)`, so anything the DOM accepts works — but only `keydown` and `keyup` are documented or used.

- `dict` (*object*) - Configuration options. **Only the 15 keys below are read.** Anything else you pass is silently ignored, because the copy loop iterates the fixed `keyboardEventPropertiesDictionary` (`keyboardEvent.js:76-95`, `136-140`).

| Key | Type | Default | Notes |
|---|---|---|---|
| `key` | string | `""` | Key name. Back-fills `keyCode`/`which` when those are absent |
| `keyCode` | number | `0` | Legacy code. Falls back to `key.charCodeAt(0)` |
| `which` | number | `0` | Defaults to the resolved `keyCode` (`keyboardEvent.js:174`) |
| `charCode` | number | `0` | Falls back to `char.charCodeAt(0)` |
| `char` | string | `""` | Character produced by the key |
| `location` | number | `0` | 0 = standard, 1 = left, 2 = right, 3 = numpad |
| `ctrlKey` | boolean | `false` | |
| `shiftKey` | boolean | `false` | |
| `altKey` | boolean | `false` | |
| `metaKey` | boolean | `false` | |
| `repeat` | boolean | `false` | Auto-repeat flag |
| `locale` | string | `""` | |
| `detail` | number | `0` | |
| `bubbles` | boolean | `false` | |
| `cancelable` | boolean | `false` | |

`altGraphKey` is read internally (`keyboardEvent.js:146`) but is **not** part of the dictionary, so it is always `undefined` — setting it has no effect.

::: danger
Earlier versions of this page listed only `key`, `keyCode`, `which`, `ctrlKey`, `shiftKey`, `altKey`, `metaKey`, `bubbles` and `cancelable`, and implied any other property was forwarded. Seven real options were missing — `char`, `charCode`, `location`, `repeat`, `locale` and `detail` — and anything outside the 15-key dictionary is dropped.
:::

#### Returns

Returns the `KeyboardEvent` / `Event` object created by `document.createEvent("KeyboardEvent")` (falling back to `document.createEvent("Event")` if that fails) and initialised with your `type`, `bubbles` and `cancelable` — a normal DOM event you can pass to `dispatchEvent()`, or one CodeMirror's keymap will read.

The factory does three things worth knowing:

1. **It mutates your `dict` object.** `keyboardEvent.js:125-134` writes `key`, `keyCode` and `which` back onto the object you passed in. Pass a fresh literal each time, or hold a frozen object and be surprised.
2. **Initialisation is best-effort.** It tries `initKeyEvent` (Firefox), then the several `initKeyboardEvent` signatures (WebKit / old WebKit / IE9 / W3C) selected by the feature probe at `keyboardEvent.js:40-74`, and finally falls back to `event.initEvent(type, bubbles, cancelable)`.
3. **Properties are forced on afterwards.** The 15 dictionary values are re-assigned with `delete` + `Object.defineProperty({ writable: true, value })`, and read-only properties are skipped inside a silent `catch` (`keyboardEvent.js:275-288`). This final pass is what makes `event.key`, `event.keyCode` etc. readable regardless of which init branch ran.

## Examples

### Basic Usage

```js
// Create Enter key press
const enterPress = createKeyboardEvent('keydown', {
		key: 'Enter'
});

// Create Ctrl+S combination
const ctrlS = createKeyboardEvent('keydown', {
		key: 's',
		ctrlKey: true
});

// Create arrow key event
const arrowLeft = createKeyboardEvent('keydown', {
		key: 'ArrowLeft'
});
```

`key: 'Enter'` back-fills the code from the built-in table (`keyboardEvent.js:24`). `key: 'ArrowLeft'` back-fills `37`.

::: warning
The back-filled code is a **string**, not a number. `keyboardEvent.js:130` uses `Object.keys(keys).find(...)`, and `Object.keys` yields strings, so `dict.keyCode` and `dict.which` become `"13"` and `"13"`. `13 == event.keyCode` is true, but `13 === event.keyCode` is not. Pass an explicit numeric `keyCode` if you need a strict comparison.
:::

### Simulating Shortcuts

```js
// Simulate Ctrl+Alt+Delete
const ctrlAltDel = createKeyboardEvent('keydown', {
		key: 'Delete',
		ctrlKey: true,
		altKey: true,
		bubbles: true,
		cancelable: true
});

// Simulate Shift+Enter
const shiftEnter = createKeyboardEvent('keydown', {
		key: 'Enter',
		shiftKey: true
});
```

### Working with Key Codes

```js
// Using key codes instead of key names
const backspace = createKeyboardEvent('keydown', {
		keyCode: 8 // Backspace key code
});

// Both key and keyCode can be used
const enter = createKeyboardEvent('keydown', {
		key: 'Enter',
		keyCode: 13
});
```

::: warning
`keyCode`-only input derives the key name from a **fixed 21-entry table** (`keyboardEvent.js:15-38`). Anything outside it falls back to `String.fromCharCode(code)` (`keyboardEvent.js:127`), i.e. a single character:

| Code | `key` | Code | `key` |
|---|---|---|---|
| 8 | `Backspace` | 27 | `Escape` |
| 9 | `Tab` | 32 | `" "` (a single space) |
| 13 | `Enter` | 33 | `PageUp` |
| 16 | `ShiftLeft` | 34 | `PageDown` |
| 17 | `ControlLeft` | 35 | `End` |
| 18 | `AltLeft` | 36 | `Home` |
| 19 | `Pause` | 45 | `Insert` |
| 20 | `CapsLock` | 46 | `Delete` |
| 37 | `ArrowLeft` | | |
| 38 | `ArrowUp` | | |
| 39 | `ArrowRight` | | |
| 40 | `ArrowDown` | | |

So `createKeyboardEvent('keydown', { keyCode: 112 })` — F1 — produces `key === 'p'`, and `createKeyboardEvent('keydown', { key: 'F1' })` produces `keyCode === 70` (the char code of `'F'`), because the reverse lookup misses and falls back to `key.charCodeAt(0)` (`keyboardEvent.js:131`). CodeMirror keymaps match on `key` names, so **always pass `key`, not `keyCode`, for anything outside this table.**
:::

## Supported keys

The `keys` table above is the *only* set with real names. Everything else you can pass as a `key` string is forwarded verbatim, and `KeyboardEvent` consumers on Chromium accept the full `UI Events` vocabulary — this is what Acode itself relies on when it forwards shortcuts:

- Arrow keys: `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`
- Navigation: `Home`, `End`, `PageUp`, `PageDown`
- Editing: `Backspace`, `Delete`, `Insert`, `Tab`, `Enter`, `Escape`
- Modifiers: `Shift`, `Control`, `Alt`, `Meta` (the table also has the side-specific `ShiftLeft` / `ControlLeft` / `AltLeft`)
- Lock / misc: `CapsLock`, `Pause`
- Space is the table's `32` entry — the key name is the literal string `" "`, **not** `"Space"`
- Printable characters: `a-z`, `A-Z`, `0-9`, and punctuation, matched literally
- Named keys outside the table (`F1`-`F12`, `Home`, `Insert`, …) reach your listener as-is, but will **not** get a correct `keyCode`

## Why a plugin would synthesize one

Acode's own `keyboard` module is the reference implementation: `src/handlers/keyboard.js:75-82` builds a `keydown` from a document-level key press and dispatches it straight onto `editorManager.editor.contentDOM`, so a hardware shortcut pressed while focus is outside the editor still reaches CodeMirror's keymap.

```js
// Forward a shortcut into the active editor, the way Acode does.
acode.setPluginInit('com.example.forward-keys', (baseUrl) => {
		const createKeyboardEvent = acode.require('createKeyboardEvent');

		const editor = window.editorManager?.editor;
		const target = editor?.contentDOM;
		if (!target) return;

		const forward = (event) => {
				const $from = event.target;
				if ($from instanceof HTMLElement) {
						if (
								$from.isContentEditable ||
								$from.closest('.prompt, #palette') ||
								$from instanceof HTMLInputElement ||
								$from instanceof HTMLTextAreaElement ||
								$from instanceof HTMLSelectElement
						) {
								return;
						}
				}
				if (!event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) return;
				if (['Control', 'Alt', 'Meta', 'Shift'].includes(event.key)) return;
				// Already inside the editor — CodeMirror has seen it, don't replay.
				if ($from === target || target.contains?.($from)) return;

				target.dispatchEvent(
						createKeyboardEvent('keydown', {
								key: event.key,
								ctrlKey: event.ctrlKey,
								shiftKey: event.shiftKey,
								altKey: event.altKey,
								metaKey: event.metaKey,
						}),
				);
		};

		document.addEventListener('keydown', forward);

		acode.setPluginUnmount('com.example.forward-keys', () => {
				document.removeEventListener('keydown', forward);
		});
});
```

Other legitimate uses: driving a CodeMirror command from a plugin UI button, unit-testing a plugin's own keymap without a hardware keyboard, and replaying a captured combo into a focused input.

## See also

- [`acode.require("keyboard")`](./keyboard.md) — the module that calls this factory.
- [`acode.require("commands")`](./commands.md) — the supported way to bind real shortcuts.
