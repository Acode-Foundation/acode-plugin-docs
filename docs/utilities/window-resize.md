# Window Resize API

The Window Resize API allows plugins to handle window resize events in Acode. This is particularly useful for managing UI elements that need to respond to window size changes or keyboard visibility.

::: info
Verified against Acode **v1.13.5**: `src/handlers/windowResize.js` (registered in `src/lib/acode.js` as `this.define("windowResize", windowResize)`).
:::

## Import

```js
const windowResize = acode.require('windowResize');
```

::: warning
`acode.require('windowResize')` returns the **`windowResize` function itself**, not a plain object — the export is `export default function windowResize() { … }`. The only members attached to it are `.on()` and `.off()`. It is also the app's own `resize` listener: `src/main.js:98` runs `window.addEventListener("resize", windowResize)`. Do **not** register it on `window` yourself expecting a separate stream of events; the geometry is already global.
:::

## Events

The API supports two types of events:

| Event | Emitted at | Meaning |
|---|---|---|
| `resizeStart` | `windowResize.js:29` | First `resize` event of a burst — fires immediately, synchronously |
| `resize` | `windowResize.js:63` | Resizing has settled — fires after a **100 ms** idle debounce |

::: danger
Both listeners are invoked as `cb()` — **with no arguments** (`src/handlers/windowResize.js:73`):

```js
function emit(eventName) {
		if (!event[eventName]) return;
		event[eventName].forEach((cb) => cb());
}
```

There is **no payload**: no width, no height, no orientation, no delta. Read `window.innerWidth`, `window.innerHeight`, `screen.orientation` and `window.visualViewport` yourself inside the callback.
:::

### When it fires

```js
export default function windowResize() {
		if (!resizeTimeout) {
				emit('resizeStart');
		}

		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(onResize, 100);
}
```

- `resizeStart` fires **once per burst** — only while `resizeTimeout` is still falsy, i.e. before the first debounce is armed.
- `resize` fires 100 ms after the **last** `resize` event, so dragging a soft keyboard or rotating the device produces exactly one `resize`.
- `onResize()` resets `resizeTimeout = null` (`windowResize.js:62`), re-arming the `resizeStart` branch for the next burst.
- It is driven **only** by `resize`. There is no `orientationchange` listener and no `visualViewport` listener in the source, so rotation reaches you purely as `resize`.

::: tip
`acode.require("keyboard")` is layered on top of these same two events (see [`src/handlers/keyboard.js:109-154`](./keyboard.md#how-the-soft-keyboard-is-detected)), and adds the soft-keyboard/external-keyboard discrimination that plain geometry lacks. Use `windowResize` for layout, `keyboard` for the IME.
:::

## Usage

### Adding Event Listeners

Use the `on()` method to listen for resize events:

```js
// Listen for resize complete
windowResize.on('resize', () => {
		// Handle resize complete
		console.log('Window resize finished, innerWidth =', window.innerWidth);
});

// Listen for resize start
windowResize.on('resizeStart', () => {
		// Handle resize start
		console.log('Window started resizing');
});
```

### Removing Event Listeners

Use the `off()` method to remove event listeners:

```js
const handleResize = () => {
		// Resize handler logic
};

// Add listener
windowResize.on('resize', handleResize);

// Remove listener
windowResize.off('resize', handleResize);
```

`off()` filters by strict identity (`windowResize.js:55`), so an inline arrow function can never be removed — keep a reference. `on()` only pushes onto the array (`windowResize.js:44`), so registering the same function twice registers it twice. An unknown `eventName` is silently ignored by both (`windowResize.js:43` and `:55`). There is no `once()` and no "remove all listeners".

## Example Use Case

Here's a example of using the Window Resize API to adjust a plugin's UI:

```js
class MyPlugin {
		constructor() {
				this.container = document.createElement('div');
				this.setupResizeHandling();
		}

		setupResizeHandling() {
				// Handle initial resize
				this.onResizeStart = () => {
						// Prepare UI for resize
						this.container.style.transition = 'none';
				};

				this.onResize = () => {
						// Update UI after resize
						this.container.style.transition = 'all 0.3s';
						this.updateLayout();
				};

				windowResize.on('resizeStart', this.onResizeStart);
				windowResize.on('resize', this.onResize);
		}

		updateLayout() {
				const windowWidth = window.innerWidth;
				if (windowWidth < 768) {
						this.container.classList.add('compact');
				} else {
						this.container.classList.remove('compact');
				}
		}
}
```

## Reacting to rotation and the soft keyboard

`resize` gives you geometry only, which is enough for both cases:

```js
acode.setPluginInit('com.example.responsive', (baseUrl, $page) => {
		const windowResize = acode.require('windowResize');
		const keyboard = acode.require('keyboard');

		let orientation = window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';

		const apply = () => {
				$page.classList.toggle('is-landscape', orientation === 'landscape');
				$page.classList.toggle('is-compact', window.innerWidth < 768);
		};

		const onResize = () => {
				const next = window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
				if (next !== orientation) {
						orientation = next;
				}
				apply();
		};

		const onKeyboardShow = () => $page.classList.add('keyboard-open');
		const onKeyboardHide = () => $page.classList.remove('keyboard-open');

		apply();
		windowResize.on('resize', onResize);
		// Soft-keyboard events are gated on there being no external keyboard,
		// so they simply never fire on a tablet with a Bluetooth keyboard.
		keyboard.on('keyboardShow', onKeyboardShow);
		keyboard.on('keyboardHide', onKeyboardHide);

		acode.setPluginUnmount('com.example.responsive', () => {
				windowResize.off('resize', onResize);
				keyboard.off('keyboardShow', onKeyboardShow);
				keyboard.off('keyboardHide', onKeyboardHide);
		});
});
```

## Notes

- The resize event is debounced internally to prevent excessive callbacks — 100 ms after the last `resize` (`windowResize.js:33`)
- Use `resizeStart` for immediate response to resize initiation; it is synchronous and fires exactly once per burst
- Use `resize` for final adjustments after resizing completes, when `window.innerWidth` / `window.innerHeight` have settled
- Event listeners should be removed when no longer needed to prevent memory leaks, and `off()` needs the original function reference
- Both events are fire-and-forget: if you register a listener after the app has already started, a resize in progress will not be replayed
- If you only care about the IME, use [`acode.require("keyboard")`](./keyboard.md) instead — plain `resize` cannot tell a soft keyboard from an external one

## See also

- [`acode.require("keyboard")`](./keyboard.md)
- [`acode.require("page")`](../editor-components/page.md)
