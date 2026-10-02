# Page Component

The Page Component in Acode allows you to create customizable pages with headers, titles, and optional navigation elements. This is useful for building plugin interfaces and new pages within the editor.

## Importing

```js
const page = acode.require('page');
```

`acode.require()` lowercases module names, so `acode.require("page")` works too.

## Usage

To create a new page:

```js
// Create basic page with title
const myPage = page('My Plugin Page');

// Create page with back button and menu icon
const backBtn = tag('span', {className: 'icon back'});
const menuBtn = tag('span', {className: 'icon menu'});

const myPage = page('My Plugin Page', {
		lead: backBtn,
		tail: menuBtn
});
```

## Signature <Badge type="tip" text="new" />

```js
page(title: string, options?: { lead?: HTMLElement, tail?: HTMLElement }) => WCPage
```

`page()` is a thin factory around the `<wc-page>` custom element. It:

1. Creates `<wc-page />`.
2. Sets `page.append = page.appendBody`, so `append()` and `appendBody()` are the same thing.
3. Builds the header and the `<div class="main">` body container (`initializeIfNotAlreadyInitialized()`), unless the element already has class `primary`.
4. Calls `settitle(title)`.
5. Appends `options.tail` to the header, then replaces the default lead with `options.lead` if given.

### Parameters

- `title` (string) - The title text shown in the page header
- `options` (object) - Optional configuration object:
		- `lead` (HTMLElement) - Element shown before the title (e.g. back button). Replaces the default `arrow_back` lead.
		- `tail` (HTMLElement) - Element shown after the title (e.g. menu icon). Appended to the header.

## Methods

| Method | Description |
|--------|-------------|
| `appendBody(...elements)` | Appends elements into the `.main` body container. No-op when there is no body |
| `appendOuter(...elements)` | Appends elements as direct children of the `<wc-page>` itself, outside `.main` (uses the native `HTMLElement.append`) |
| `append(...elements)` | Alias of `appendBody` |
| `on(event, callback)` | Adds a listener. Valid events: `show`, `hide`, `willconnect`, `willdisconnect` |
| `off(event, callback)` | Removes a listener previously added with `on` |
| `settitle(title)` | Updates the page title (also fires when the `data-title` attribute changes) |
| `hide()` | Animates the page out and removes it from the DOM |
| `initializeIfNotAlreadyInitialized()` | Builds the header/body if they are missing. Called for you by `page()` |

::: warning There is no built-in `show()`
`WCPage` has **no** `show()` method — that is why Acode's own pages assign one. You must define it yourself, usually by pushing a hide action onto the action stack and appending the page to `app` (see [Action stack](#action-stack) below).
:::

:::info
You'll need to implement `show` method according to your situation at your own.
:::

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `body` | HTMLElement | The `.main` (or `main`) content container. Also settable — assigning replaces the body element in place |
| `header` | HTMLElement | The header `tile` element. Also settable |
| `lead` | HTMLElement | The lead element (default: `<span class="icon arrow_back" attr-action="go-back">`, which calls `hide()`). Also settable |
| `innerHTML` | string | Proxied to `body.innerHTML` |
| `textContent` | string | Proxied to `body.textContent` |
| `handler` | PageHandler | Internal page-transition object. Owns the `<span class="page-replacement">` used for smooth back navigation |
| `onhide` | `() => void` | Called synchronously at the **start** of `hide()` |
| `onconnect` | `() => void` | Called from `connectedCallback()`, after the fade-in animation starts |
| `ondisconnect` | `() => void` | Called from `disconnectedCallback()`, before `hide` listeners |
| `onwilldisconnect` | `() => void` | Called when the page is swapped out for its replacement placeholder |
| `onwillconnect` | `() => void` | Called when the page is restored from that placeholder |

Class names that change behaviour:

| Class | Effect |
| --- | --- |
| `primary` | Use the existing `header` element instead of creating one, and skip the show/hide fade. Also disables the page-replacement mechanism |
| `no-transition` | Shorten the fade in/out to ~0.08 s |
| `hide` | Removed automatically on connect; add it yourself to keep a page visually hidden |

::: tip There is no `onshow`
Use `page.on('show', cb)` for the connect-time callback, or `page.onconnect`. `WCPage` declares `onhide`, `onconnect`, `ondisconnect`, `onwillconnect` and `onwilldisconnect` — but **not** `onshow`.
:::

## Lifecycle and ordering <Badge type="tip" text="new" />

`$page` is attached to the DOM only when you append it yourself (`app.append($page)`). Ordering:

| Step | What runs |
| --- | --- |
| 1 | `page()` returns — the element is **not** in the document yet |
| 2 | `app.append($page)` → `connectedCallback()` fires: `.hide` is removed, the fade-in animation starts, then `onconnect()`, then every `show` listener |
| 3 | ... user interacts ... |
| 4 | `$page.hide()` → `onhide()` runs **immediately** |
| 5 | The fade-out animation runs, then the element (and its replacement placeholder) is removed |
| 6 | `disconnectedCallback()` fires: `ondisconnect()`, then every `hide` listener |

A third page's appearance replaces the oldest visible page with a `<span class="page-replacement">` placeholder (`onwilldisconnect` fires). Going back restores it (`onwillconnect` fires) and restores the cached scroll position of `body`.

## Action stack <Badge type="tip" text="new" />

`acode.require("actionStack")` is what makes the hardware/gesture back button close your page instead of the app. Acode's own pages all follow the same pattern:

```js
const actionStack = acode.require('actionStack');

const settingsPage = page('Plugin Settings');

settingsPage.show = () => {
	actionStack.push({
		id: 'my-plugin-settings',
		action: settingsPage.hide,
	});
	app.append(settingsPage);
};

settingsPage.onhide = () => {
	actionStack.remove('my-plugin-settings');
};
```

| Member | Signature | Description |
| --- | --- | --- |
| `length` | `number` | Number of pushed actions |
| `push(fun)` | `push({id: string, action: Function})` | Push a back-stack entry. `id` must be unique enough to `remove()` it |
| `pop(repeat?)` | `async pop(repeat?: number)` | Pop and run the newest action. When the stack is empty it shows the exit confirmation (`settings.value.confirmOnExit`) and then calls `navigator.app.exitApp()` |
| `remove(id)` | `remove(id: string) => boolean` | Remove an entry without running it. Returns `true` when found |
| `has(id)` | `has(id: string) => boolean` | Membership test |
| `get(id)` | `get(id: string) => {id, action} \| undefined` | Look up an entry |
| `freeze()` / `unfreeze()` | `() => void` | Make `pop()` a no-op (e.g. while a blocking dialog is open) |
| `setMark()` / `clearFromMark()` | `() => void` | Bulk-remove everything pushed after a mark |
| `onCloseApp` | `get/set Function` | Callback run before `exitApp()`; may return a Promise |

::: tip
Always pair `push()` in `show()` with `remove()` in `onhide`, and give each page a distinct `id` — otherwise back presses will close the wrong page. Acode's own plugin page (`src/lib/loadPlugin.js`) uses the plugin id as the action id.
:::

## Example

Here's a complete example of creating a settings page for a plugin:

```js
function createSettingsPage() {
		// Create page elements
		const backButton = tag('span', {
				className: 'icon back',
				dataset: {
        				action: "back-btn"
      				},
				onclick: () => settingsPage.hide()
		});

		const saveButton = tag('span', {
				className: 'icon save',
				dataset: {
        				action: "save-btn"
      				},
				onclick: () => {console.log("save settings")}
		});

		// Initialize page
		const settingsPage = page('Plugin Settings', {
				lead: backButton,
				tail: saveButton
		});

		// Add content
		const form = tag('form');
		const input = tag('input', {
				type: 'text',
				value: 'Default value'
		});

		form.append(input);
		settingsPage.appendBody(form);
                settingsPage.show = () => {
			// to have proper behaviour for mobile back button press, check actionStack doc for more
                        const actionStack = acode.require("actionStack");
			actionStack.push({
        			id: "some_id",
        			action: settingsPage.hide,
      			});
			app.append(settingsPage);
    		};

		// Show the page
		settingsPage.show();
}
```

## Complete plugin example <Badge type="tip" text="new" />

A settings-style page with show/hide, live re-render and cleanup:

```js
// main.js
if (window.acode) {
	class MyPluginPage {
		constructor(id) {
			this.id = id;
			this.actionId = `${id}-page`;
			this.actionStack = acode.require('actionStack');
			this.toast = acode.require('toast');
			this.page = acode.require('page')('My Plugin');
			this.input = tag('input', {type: 'text', placeholder: 'Name'});

			this.page.appendBody(
				tag('p', {innerHTML: 'Type a name, then press back.'}),
				this.input,
			);

			// Fired synchronously at the start of hide()
			this.page.onhide = () => {
				this.actionStack.remove(this.actionId);
			};

			// Fired every time the element is (re)attached to the DOM
			this.page.on('show', () => {
				this.input.focus();
			});

			this.show = this.show.bind(this);
		}

		show() {
			if (this.page.isConnected) return; // never push twice

			this.actionStack.push({
				id: this.actionId,
				action: this.page.hide,
			});
			app.append(this.page);

			this.toast('Ready');
		}

		hide() {
			this.page.hide();
		}

		dispose() {
			// hide() already runs onhide -> actionStack.remove(this.actionId)
			this.hide();
		}
	}

	let instance;

	acode.setPluginInit(
		'com.example.plugin',
		(baseUrl, $page) => {
			instance = new MyPluginPage('com.example.plugin');

			// Reuse the page Acode already gives you — its show()/onhide are
			// already wired to the action stack under the plugin id.
			$page.appendBody(
				tag('button', {
					textContent: 'Open page',
					onclick: () => instance.show(),
				}),
			);
		},
		{
			list: [
				{key: 'greeting', text: 'Greeting', prompt: 'Greeting text'},
			],
			cb(key, value) {
				instance.input.placeholder = value;
			},
		},
	);

	acode.setPluginUnmount('com.example.plugin', () => {
		instance?.dispose();
		instance = undefined;
	});
}
```

::: tip
The `$page` passed to your `setPluginInit` callback is created by Acode (`src/lib/loadPlugin.js`). Its `show()` already pushes `actionStack.push({id: pluginId, action: $page.hide})`, and its `onhide` already calls `actionStack.remove(pluginId)`. Append a button to it instead of building a second page when you only need a launcher.
:::