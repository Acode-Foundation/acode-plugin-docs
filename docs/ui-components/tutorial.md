# Tutorial

The tutorial module provides functionality to display one-time tutorial messages to users.

## Import

```js
const tutorial = acode.require('tutorial');
```

:::info
`tutorial` is registered with `this.define("tutorial", tutorial)`, so the module **is** the function itself — there is no wrapper object and no second call form. It is *not* a method on the `acode` object; `acode.tutorial` does not exist.

`acode.require` lower-cases the module name, so `acode.require('Tutorial')` returns the same function. Unknown names return `undefined`, so guard the require if you also support older app versions.
:::

## Usage

The tutorial function shows a message only once to the user by storing its state in localStorage.

### Syntax

```js
tutorial(id: string, message: string | HTMLElement | (hide: () => void) => HTMLElement): void
```

### Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | `string` | Yes | – | Unique identifier for the tutorial message. Used **verbatim** as the `localStorage` key. The stored value is always the string `"true"`. |
| `message` | `string` \| `HTMLElement` \| `(hide: () => void) => HTMLElement` | Yes | – | The content to display. When it is a `function` it is called with the toast `hide` callback and its return value is used as the message. |

The `message` value may be one of:

- **string** — plain text message, inserted into the toast's `<span class="message">`
- **HTMLElement** — custom HTML content
- **Function** — receives the toast `hide` callback and must return the `HTMLElement` to display

### Returns

`undefined`. The function is **not** promise-based and never reports back whether the toast was actually shown, dismissed, or queued behind another toast.

### Example

```js
// Basic text message
tutorial('welcome-msg', 'Welcome to my plugin!');

// HTML message
const msgEl = document.createElement('div');
msgEl.innerHTML = `
		<h3>Getting Started</h3>
		<p>Click the button below to begin:</p>
		<button onclick="startTutorial()">Start</button>
`;
tutorial('start-guide', msgEl);

// Function with hide callback
tutorial('feature-intro', (hide) => {
		const container = document.createElement('div');
		const closeBtn = document.createElement('button');
		closeBtn.textContent = 'Got it';
		closeBtn.onclick = hide;
		container.appendChild(closeBtn);
		return container;
});
```

The message will only be shown once - subsequent calls with the same ID will not display the message again.

## Execution Order <Badge type="tip" text="new" />

The function is four lines long, and the order matters:

| Step | Code | Effect |
|---|---|---|
| 1 | `if (localStorage.getItem(id) === "true") return;` | Early return. **Only** the exact string `"true"` suppresses the message — any other stored value still shows it. |
| 2 | `localStorage.setItem(id, "true");` | The one-time flag is written **before** anything is rendered. |
| 3 | `message = message(toast.hide)` | Only for the function form. The return value replaces `message`. |
| 4 | `toast(message, false, "#17c", "#fff");` | Hands the content to the toast queue. |

Acode itself uses it exactly this way when it wants a one-off hint:

```js
if (!isConsole && !localStorage.__init_runPreview) {
	localStorage.__init_runPreview = true;
	tutorial('run-preview', strings['preview info']);
}
```

## Complete Plugin Example <Badge type="tip" text="new" />

```js
acode.setPluginInit('com.example.guide', () => {
	const tutorial = acode.require('tutorial');
	const ID = 'com.example.guide:welcome';

	// 1. Plain one-time toast. Shown at most once per install.
	tutorial(ID, 'Welcome! Open the sidebar to see the tour.');

	// 2. Rich one-time toast with an explicit dismiss button.
	const panel = document.createElement('div');
	panel.innerHTML = '<h3>New in this release</h3><p>Right-click a tab for more actions.</p>';

	const close = document.createElement('button');
	close.textContent = 'Got it';
	// The element form gets no hide callback, so close the toast yourself.
	close.onclick = () => acode.require('toast').hide();
	panel.appendChild(close);

	tutorial('com.example.guide:whats-new', panel);

	// 3. Opt-in re-show, e.g. from a command or a settings page.
	acode.addCommand({
		name: 'example.guide.showIntro',
		description: 'Show the plugin intro again',
		readOnly: false,
		exec: () => {
			localStorage.removeItem(ID); // reset the one-time flag
			tutorial(ID, 'Welcome again!');
			return true;
		}
	});
});

// Hide an in-flight tutorial toast when the plugin is unloaded.
acode.setPluginUnmount('com.example.guide', () => {
	const toast = acode.require('toast');
	toast.hide();
});
```

## Notes

- The tutorial state is persisted using localStorage, under the exact `id` string you pass
- Messages are displayed as toast notifications via `toast(message, false, "#17c", "#fff")` — see [Toast](./toast.md)
- Default colors are blue (`#17c`) background with white (`#fff`) text. They are hard-coded in the `tutorial` call, not configurable
- The `duration` argument is `false`, so the toast **never auto-dismisses** and gets a `clearclose` dismiss button instead
- The hide callback allows custom control of message dismissal
- Toasts are queued: if another `#toast` is already on screen, yours is pushed onto a FIFO queue and shown when the previous one hides
- The hide callback passed to the function form is `toast.hide` — the module-level helper that closes whichever `#toast` element is currently mounted

## Gotchas

:::warning
`id` is a raw, global `localStorage` key. Prefix it with your plugin id (`"com.example.plugin:welcome"`) or you can collide with another plugin or with the app, which uses bare keys such as `"run-preview"`.
:::

:::warning
The flag is written *before* the toast is created. If your function `message` throws, or the toast never reaches the screen, the tutorial is still marked as seen and will never appear again.
:::

:::warning
There is no reset API. To re-show a tutorial — for testing, or after a plugin update that changes the copy — delete the key yourself:

```js
localStorage.removeItem('com.example.plugin:welcome');
```

:::

:::warning
`toast.hide` targets the first `#toast` in the DOM, which is the *currently visible* one, not necessarily yours. If your tutorial toast is queued behind another toast, calling `hide` from your own button closes someone else's toast.
:::

## Built-in Icons <Badge type="tip" text="new" />

`tutorial` takes no icon, but it renders the built-in toast chrome for you:

| Icon class | Rendered by | Markup |
|---|---|---|
| `clearclose` | The toast dismiss button shown when `duration === false` | `<button class="icon clearclose">` |

For custom icons inside your own toast content use a real element:

```js
const row = document.createElement('div');
row.className = 'icon clearclose'; // any built-in icon class works here
```

The complete list of icon classes that ship with Acode, and how to register your own, is documented in [Built-in Icons](../interface-apis/side-buttons.md#built-in-icons).

## Related

- [`acode`](../global-apis/acode.md) — `define` / `require` and the command registry
- [Toast](./toast.md) — the underlying component, including `toast.hide`
- [Context Menu API](../interface-apis/context-menu.md) — richer UI than a toast
- [Selection Menu](./selection-menu.md) — editor text-selection actions
- [Side Buttons](../interface-apis/side-buttons.md) and [Sidebar Apps](../interface-apis/sidebar-apps.md) — persistent UI surfaces
