# Context Menu API

The Context Menu API allows you to create and manage custom context menus in your plugin. This API provides an easy way to add menus and other contextual interfaces.

## Getting Started

To use the Context Menu API in your Acode plugin, first require it:

```js
const contextMenu = acode.require('contextMenu');
```

:::info
The module is registered as `contextMenu` (`this.define("contextMenu", Contextmenu)`). `acode.require` lower-cases the name, so `acode.require('contextmenu')` works too, but `contextMenu` matches the documented casing.

`contextMenu` is **not** a global — the bare `contextmenu(...)` seen in older examples is not available. Always keep the value returned by `require`.
:::

## API Reference

### Creating a Context Menu

The main function to create a context menu:

```js
contextMenu(content, options)
```

**Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `content` | `string` | No | `null` | The HTML content to show in the menu. Inserted as the menu's `innerHTML` at creation time. Omit it (or pass an object) to build the menu only from `options`. |
| `options` | `ContextMenuOptions` | No | `{}` | Configuration options. |

You can also create a menu with just options:

```js
contextMenu(options)
```

When the first argument is an object and the second is omitted, that object is used as `options` and `content` becomes `null`.

**Returns:** the menu element itself — a `<ul class="context-menu scroll">`, with `show`, `hide`, `destroy`, `onshow` and `onhide` attached. You can attach your own listeners to it, override its methods, and read its position.

### Context Menu Options

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `left` | `number` | No | `"auto"` | Left position in pixels. |
| `top` | `number` | No | `"auto"` | Top position in pixels. |
| `bottom` | `number` | No | `"auto"` | Bottom position in pixels. |
| `right` | `number` | No | `"auto"` | Right position in pixels. |
| `transformOrigin` | `string` | No | – | CSS `transform-origin` property. Use it to grow the menu away from the edge it is anchored to. |
| `toggler` | `HTMLElement` | No | – | Element that toggles the menu on `click`, and the anchor used for positioning. On `Escape` focus returns to it. |
| `onshow` | `() => void` | No | no-op | Called when the menu is shown. |
| `onhide` | `() => void` | No | no-op | Called when the menu is hidden. |
| `items` | `Array<[string, string]>` | No | – | Menu items as `[text, action]` pairs. Each pair becomes `<li data-action="{action}">{text}</li>`. |
| `onclick` | `(event: MouseEvent) => void` | No | – | Called for every click inside the menu, with `this` bound to the menu element. Runs **before** `onselect`. |
| `onselect` | `(action: string) => void` | No | – | Called when an item with a `data-action` is clicked, with `this` bound to the menu element. |
| `innerHTML` | `(this: HTMLElement) => string` | No | – | Returns an HTML string for the menu content. Called on **every** `show()` and replaces all children. |

:::info
`onselect` receives the **second** element of the `[text, action]` pair — i.e. the `data-action` value — not an index and not `text`. `hide()` runs before `onselect`, so the menu is already fading out (and is removed from the DOM 100 ms later) when your handler runs.
:::

### Menu Methods

The returned menu object has these methods:

| Method | Type | Description |
|--------|------|-------------|
| `show()` | `() => void` | Display the menu. Pushes a `main-menu` entry onto the [Action Stack](../advanced-apis/action-stack.md), invokes `onshow()`, resolves `innerHTML`, appends the menu and its mask to `app`, and focuses the first child element when it is focusable. |
| `hide()` | `() => void` | Hide the menu. Removes the `main-menu` Action Stack entry, invokes `onhide()`, adds the `hide` class, and removes the mask and menu from the DOM after 100 ms. |
| `destroy()` | `() => void` | Remove the menu completely: drops the `keydown` listener, removes the menu and mask from the DOM, and detaches the `toggler` `click` listener. |

`menu.onshow` and `menu.onhide` are plain properties holding your `onshow` / `onhide` callbacks (or no-ops), and they are what `show()` / `hide()` invoke. Because they are writable, you can reassign or wrap them after creation — which is exactly what Acode's own tab context menu does to detach a document-level ghost-click suppressor.

### Keyboard support

The menu handles its own `keydown`:

| Key | Behaviour |
|---|---|
| `Enter`, `Space`, `Spacebar` | Activates the focused row by dispatching a synthetic `MouseEvent("click")` marked `keyboardActivated: true` |
| `ArrowDown` / `ArrowUp` | Moves focus between actionable rows, wrapping at both ends |
| `Home` / `End` | Jumps to the first / last actionable row |
| `Escape`, `Esc` | Hides the menu and returns focus to `toggler` |

Keys coming from nested interactive controls (checkboxes, inputs) are ignored, so those keep their native behaviour.

### Disabled rows and separators <Badge type="tip" text="new" />

There is **no** `disabled`, `separator`, `submenu`, `children` or `keepOpen` option. Rows are disabled by class instead, and the component honours these conventions:

| Convention | Effect |
|---|---|
| `<li class="disabled">` | Not focusable, cannot be activated by keyboard, and `pointer-events: none` + 50 % opacity via CSS |
| `<li class="separator">` | Same as disabled |
| `<hr>` | Skipped by keyboard navigation, styled as a divider |
| `menu.classList.add("disabled")` | Disables the whole menu |

Because these are class names, you need the `innerHTML` option (or your own `menu.append(...)`) to use them together with `items`.

## Basic Example

Here's a simple example of creating and using a context menu:

```js
const contextMenu = acode.require('contextMenu');

const menu = contextMenu('Menu Content', {
		top: 50,
		left: 100,
		items: [
				['Item 1', 'action1'],
				['Item 2', 'action2']
		],
		onselect(action) {
				console.log('Selected:', action);
		}
});

// Show the menu
menu.show();

// Hide the menu
menu.hide();
```

## Complete Plugin Example <Badge type="tip" text="new" />

```js
acode.setPluginInit('com.example.menudemo', () => {
	const contextMenu = acode.require('contextMenu');

	// 1. Menu anchored to a toggler and driven by an items/onselect pair, so a
	//    tap outside or the Back button dismisses it. Acode uses this exact
	//    pattern for the plugin filter menu.
	contextMenu({
		toggler: document.getElementById('filter-button'),
		top: '8px',
		right: '16px',
		items: [
			['Top rated', 'orderBy:top_rated'],
			['Newly added', 'orderBy:newest'],
			['Most downloaded', 'orderBy:downloads'],
		],
		onselect(action) {
			acode.require('toast')(`Filter: ${action}`);
		},
	});

	// 2. Long-press / right-click menu built from raw HTML so it can use
	//    icons, a separator and a disabled row. 'action' attributes are read
	//    with getAttribute(), matching what the app does.
	function openTabMenu(file) {
		const menu = contextMenu({
			left: file.tab.getBoundingClientRect().left,
			top: file.tab.getBoundingClientRect().bottom + 4,
			transformOrigin: 'top center',
			innerHTML() {
				return `
					<li action="copy-path"><span class="icon file_copy"></span><span class="text">Copy path</span></li>
					<li class="separator"></li>
					<li action="close-tab" class="${file.readOnly ? 'disabled' : ''}"><span class="icon clearclose"></span><span class="text">Close</span></li>
				`;
			},
		});

		menu.addEventListener('click', (event) => {
			// Ignore ghost clicks that follow a touch-based long press.
			if (event.detail === 0 && !event.keyboardActivated) return;
			const action = event.target.closest('[action]')?.getAttribute('action');
			if (!action) return;
			menu.hide();
			acode.exec(action, file.id);
		});

		menu.show();
		return menu;
	}

	// editorManager.on('file-loaded', (file) => {
	// 	file.tab?.addEventListener('contextmenu', (e) => {
	// 		e.preventDefault();
	// 		openTabMenu(file);
	// 	});
	// });
});
```

## Dismissal behaviour

A context menu is dismissed by any of:

| Trigger | Source |
|---|---|
| Tap / mouse-down on the mask overlay | `ontouchstart` / `onmousedown` on `<span class="mask">` |
| Android Back button | The `main-menu` entry pushed onto the Action Stack |
| `Escape` / `Esc` key | The menu's `keydown` handler |
| Clicking a row, **only when `onselect` is set** | `hide()` runs immediately before `onselect` |
| Your own code | `menu.hide()` or `menu.destroy()` |

:::tip
With the `innerHTML` form there is no `onselect`, so a row click does **not** close the menu — you must call `hide()` yourself, exactly as in the example above.
:::

## Gotchas

:::warning
The Action Stack entry uses the hard-coded id `"main-menu"`, and `actionStack.remove(id)` deletes the **first** match. If two context menus are open at once, closing one can strip the other's Back handler. Close the previous menu before opening a new one.
:::

:::warning
`show()` pushes a new Action Stack entry every time it is called, and `destroy()` never removes the entry. Calling `show()` twice stacks two entries, and a Back press after `destroy()` still calls `hide()` on a detached element.
:::

:::warning
Position options are read with `options.top || "auto"` (same for `left` / `right` / `bottom`), so a literal `0` counts as "not set" and triggers `toggler`-based positioning. Use small non-zero values, or rely on `toggler`.
:::

:::warning
`content` and `innerHTML` are assigned to `innerHTML` verbatim — nothing is escaped or sanitised. Never interpolate file names, clipboard contents or any other untrusted string into them.
:::

:::warning
There is no `keepOpen` flag and no submenu support. To keep a menu open across row clicks, omit `onselect`, handle the click yourself and call `hide()` conditionally.
:::

## Built-in Icons <Badge type="tip" text="new" />

Rows commonly carry an icon as their first child. These are the classes Acode itself uses in its menus and row lists:

| Icon class | Used for |
|---|---|
| `clearclose` | Dismiss a filter message, delete a notification |
| `delete` | Remove a notification |
| `tune` | Filter controls |
| `add` | Add a plugin source |
| `replay` | Rebuild an installed plugin |
| `more_vert` | Per-item overflow menu |
| `file_downloadget_app` | Install button |
| `replace_all` | Replace-all toggle |
| `account_circle` | Sidebar user avatar |
| `logout` | Sidebar logout row |

With the `items` form you get text-only rows. To add an icon, a `.value` sub-label, a separator or a disabled row, use the `innerHTML` form:

```js
contextMenu({
  innerHTML() {
    return `<li action="copy-path"><span class="icon file_copy"></span><span class="text">Copy path</span></li>`;
  },
}).show();
```

:::tip
`innerHTML` replaces **all** children on every `show()`. Any `items` you also pass are appended at creation time and then discarded by the first `show()`, so don't mix the two forms.
:::

The complete catalogue of built-in icon classes — and `acode.addIcon` for your own — is in [Built-in Icons](../interface-apis/side-buttons.md#built-in-icons).

## Related

- [`acode`](../global-apis/acode.md) — `define` / `require` and `acode.exec`
- [Action Stack](../advanced-apis/action-stack.md) — the Back-button integration used by every context menu
- [Selection Menu](../ui-components/selection-menu.md) — editor text-selection actions
- [Sidebar Apps](./sidebar-apps.md) and [Side Buttons](./side-buttons.md) — other UI surfaces
