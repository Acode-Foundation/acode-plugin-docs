# Settings

The Settings module provides a way to interact with Acode's settings, allowing you to read, update and listen for changes to settings values.

`acode.require('settings')` returns Acode's **live** `Settings` singleton — the same object the app itself uses. Mutating it changes the app's behaviour immediately.

## Getting Started

To use the Settings module, first import it:

```js
const settings = acode.require('settings');
```

## Module shape <Badge type="tip" text="new" />

| Member | Type | Description |
| --- | --- | --- |
| `value` | `object` | The **live** settings object. Assigning to it changes the app immediately, but does **not** save or emit events on its own |
| `uiSettings` | `object` | Map of settings pages keyed by name, e.g. `plugin-<id>`. Lives **outside** `value`, so it is never written to `settings.json` |
| `get(key)` | `(key: string) => any` | Shorthand for `value[key]` |
| `update(settings?, showToast?, saveFile?)` | `async (...) => Promise<void>` | Apply and persist changed settings, emitting events |
| `reset(setting?)` | `async (setting?: string) => Promise<void \| false>` | Restore defaults |
| `on(event, callback)` | `(event: string, callback: Function) => void` | Subscribe |
| `off(event, callback)` | `(event: string, callback: Function) => void` | Unsubscribe |
| `settingsFile` | `string` | Absolute path of `settings.json` (set during `init()`) |

## Basic Usage

### Reading Settings

Use the `get()` method to read a setting value:

```js
// Get current font size
const fontSize = settings.get('fontSize');

// Get current theme
const theme = settings.get('appTheme');

// value[key] is the same thing
const tabSize = settings.value.tabSize;
```

::: warning `get()` never throws
`get()` is `value[key]`. An unknown key returns `undefined` — there is no default-value fallback and no validation.
:::

### Adding New Fields 

Add one field or more then one subfields using `value[]` attribute:

```js
// make sure to follow proper JSON syntax, these fields will be directly added to settings 

// syntax 
settings.value["your-superkey"] = {
    key: value,
    key: value
    // repeat as per your needs 
}

// Example Use 
settings.value["my-acode-plugin.id"] = {
    fontSize: "16px",
    port: 5000,
    user: "john doe"
}
```

::: warning Persist it yourself — and know when events fire
Assigning to `settings.value` only changes the in-memory object. Call `settings.update(false)` afterwards: it writes **the whole** `value` (brand-new keys included) to `settings.json` without a toast. That is what Acode's own icon-pack code does with `settings.value.iconTheme`.

```js
settings.value['my-acode-plugin.id'] = { port: 5000 };
await settings.update(false); // false = no confirmation toast, saveFile defaults to true
```

Two subtleties:

- **Change detection only looks at keys that already existed in the last saved snapshot.** A key you just introduced will be written to disk, but `update:<key>` does **not** fire for it during that same call — it only becomes "changed" from the next launch onwards. Deep objects are compared with a recursive equality check, so mutating a nested property *does* mark its **top-level** key as changed.
- **Events are keyed by top-level key, never by nested path.** With `settings.value['my-plugin'] = { port }`, subscribe to `settings.on('update:my-plugin', cb)` — there is no `update:my-plugin.port`.
:::

::: tip Idiomatic plugin pattern
Store everything under one namespaced top-level key. Assign it once at startup so it exists in the file, then mutate the nested object and call `settings.update(false)`. Every later change is detected normally and emits `update:<your-key>`.

```js
const KEY = 'my-plugin';

settings.value[KEY] ??= { port: 5000, host: 'localhost' };
await settings.update(false); // ensure it is on disk

// later, on any change:
settings.value[KEY].port = 8080;
await settings.update(false); // emits update:my-plugin
```
:::

### Updating Settings

Update one or more settings using the `update()` method:

```js
// Update single setting
await settings.update({
		fontSize: '16px'
});

// Update multiple settings
await settings.update({
		fontSize: '16px',
		appTheme: 'dark',
		tabSize: 4
});
```

#### `update(settings?, showToast?, saveFile?)`

| Argument | Type | Default | Description |
| --- | --- | --- | --- |
| `settings` | `object` | `undefined` | Keys to assign. **Only keys already present in `settings.value` are applied** |
| `showToast` | `boolean` | `true` | Show the confirmation toast. `update(false)` is the idiomatic "silent persist" call |
| `saveFile` | `boolean` | `true` | Write `settings.json`. Pass `false` to fire events without persisting |

Calling `update(true)` (or `update(false)`) is treated as `update(undefined, showToast)`.

What happens, in order:

1. Changed keys are computed by diffing `settings.value` against the last saved snapshot (objects compared deeply).
2. For each changed key: the built-in applier runs (`animation`, `uiZoom` and `lang` have side effects), then the `update` listeners and that key's `update:<key>` listeners are called with `settings.value[key]`.
3. `settings.json` is written, unless `saveFile` is `false`.
4. Then the `update:<key>:after` listeners run with `settings.value[key]`.

::: warning Changed keys only
Keys you pass that are **not already in `settings.value`** are silently ignored. Assign the key directly (`settings.value.x = ...`) before calling `update()` if it is new.
:::

### Resetting Settings

Reset settings to their default values:

```js
// Reset all settings
await settings.reset();

// Reset specific setting
await settings.reset('fontSize');
```

`reset(setting)` returns `false` (and changes nothing) when the key is not an Acode default. Every `reset` listener is then called with the whole `settings.value`.

::: danger `reset()` replaces the `value` object
`reset()` (with no argument) assigns `this.value = this.#defaultSettings`, a **new object**. Any plugin variable that captured `settings.value` — or a nested object inside it — is now detached and writes to it are lost. Re-read `settings.value` after a global reset:

```js
await settings.reset();
settings.value['my-plugin.id'] = { port: 5000 }; // re-read, do not reuse the old object
await settings.update(false);
```

`reset('someKey')` mutates in place and is safe.
:::

## Event Handling

The settings module allows you to listen for setting changes using event handlers.

### Listening for Changes

```js
// Listen for font size changes
settings.on('update:fontSize', (newValue) => {
		console.log('Font size changed to:', newValue);
});

// Listen for theme changes
settings.on('update:appTheme', (newTheme) => {
		console.log('Theme changed to:', newTheme);
});
```

### Removing Event Listeners

```js
const handler = (value) => {
		console.log('Font size:', value);
};

// Add listener
settings.on('update:fontSize', handler);

// Remove listener when no longer needed
settings.off('update:fontSize', handler);
```

## Events <Badge type="tip" text="corrected" />

| Event | Payload | When |
| --- | --- | --- |
| `update` | `(value)` | For **every** changed setting. Receives the value of the setting currently being processed |
| `update:<setting>` | `(value)` | For that setting — but see the warning below |
| `update:<setting>:after` | `(value)` | Same, but after `settings.json` has been written |
| `update:after` | `(value)` | After saving, for every changed setting |
| `reset` | the entire `settings.value` | Once, after `reset()` finished |

Three keys are matched by listener name: `update`, `update:after` and `reset`. Every other name is created lazily, so `update:<anyKey>` and `update:<anyKey>:after` work for keys Acode does not know about, including your own plugin keys.

::: warning `update:<key>` listeners can fire more than once per `update()` call
Both loops accumulate listeners into a **single shared array** while iterating the changed keys. Once your `update:x` listener has been pushed, it is invoked for that setting *and for every remaining changed setting*. The same applies to `update:x:after` and `update:after`.

This only bites when one `update()` call changes two or more settings. Guard by comparing the payload, or keep the handler cheap and idempotent:

```js
let lastPort;
settings.on('update:my-plugin', (values) => {
	if (values.port === lastPort) return;
	lastPort = values.port;
	// …
});
```
:::

::: danger `off()` removes the wrong entry when the callback is not registered
`off()` is implemented as `list.splice(list.indexOf(callback), 1)`. When the callback is not in the list, `indexOf` returns `-1` and `splice(-1, 1)` deletes the **last** listener. Always pass the exact same function reference you gave to `on()`, and only call `off()` while you know it is registered.
:::

## Plugin settings pages <Badge type="tip" text="new" />

### Registering

`acode.setPluginInit(id, init, {list, cb})` builds a ready-made settings page for you and stores it under `appSettings.uiSettings["plugin-<id>"]`:

```js
acode.setPluginInit(
	'com.example.plugin',
	(baseUrl) => { /* ... */ },
	{
		list: [
			{ key: 'greeting', text: 'Greeting', prompt: 'Enter a greeting' },
			{ key: 'verbose', text: 'Verbose logging', checkbox: false },
		],
		cb(key, value) {
			// key matches the ListItem key you defined
		},
	},
);
```

Acode builds the page with these options, which is why plugin settings keep your declared order and render their value in the row tail:

| Option | Value used by Acode |
| --- | --- |
| `preserveOrder` | `true` |
| `pageClassName` | `"detail-settings-page"` |
| `listClassName` | `"detail-settings-list"` |
| `valueInTail` | `true` |
| `groupByDefault` | `true` |
| `type` | `"united"` (default) — searching covers all settings pages, not just this one |

### Where it appears

The page is **not** part of Acode's main Settings list. `src/pages/plugin/plugin.js` looks up `settings.uiSettings["plugin-" + plugin.id]`, renames the page to the plugin's display name, and appends a gear icon to the plugin details page header that calls `pluginSettings.show()`.

`unmountPlugin(id)` deletes the key (`delete appSettings.uiSettings["plugin-" + id]`) and calls `fileIcons.unregisterByPlugin(id)`. That is why a plugin's settings row disappears when it is disabled, reloaded or fails to initialize.

### Building the page yourself

::: warning `settingsPage` is not a public module
`acode.require('settingsPage')` returns `undefined` — `src/lib/acode.js` imports the component but never registers it. Plugins must go through `acode.setPluginInit(id, init, {list, cb})`.
:::

The page object Acode builds *is* reachable, through `settings.uiSettings`. You can drive it from a command or a page of your own:

```js
const settings = acode.require('settings');

function openMySettings() {
	const page = settings.uiSettings['plugin-com.example.plugin'];
	page?.show(); // also: setTitle(), search(), restoreList(), hide()
}
```

The returned page object exposes: `show(goTo?)`, `hide()`, `search(key)`, `restoreList()`, `setTitle(title)`, `setItemVisibility(key, visible)`, `onClose(callback)` and `getListElement()`.

`show(goTo)` pushes `{id: title}` onto the action stack, appends the page to `app`, shows an ad, then either scrolls to and clicks the row whose `data-key` matches `goTo`, or focuses the list. `show()`/`hide()` are removed from the back stack by the page's own `onhide`. `onClose` callbacks run once when the page hides, and their errors are caught and logged.

### `ListItem` shape <Badge type="tip" text="new" />

```js
{ key: string, text: string, ... }
```

`key` must be unique (it becomes `data-key`), `text` is the row title and is capitalised for display.

| Field | Type | Effect |
| --- | --- | --- |
| `text` | `string` | Row title (capitalised) |
| `key` | `string` | Row identity, passed to `cb` and `setItemVisibility` |
| `value` | `any` | Current value. A **boolean** `value` also turns the row into a checkbox switch |
| `checkbox` | `boolean` | Force checkbox-switch rendering, independent of `value` |
| `prompt` | `string` | Tap the row to open a prompt dialog; the typed text becomes the new value |
| `promptType` | `string` | `"text"`, `"textarea"`, `"number"`, `"tel"`, `"search"`, `"email"`, `"url"`, `"filename"` |
| `promptOptions` | `object` | `{match, required, placeholder, capitalize, test}` |
| `select` | `Array` | Tap the row to open a select dialog. Items may be strings, `[value, text, icon, disabled, letters, checkbox]` tuples, or objects `{value, text, subText, icon, fileIcon, className, title, disabled, letters, checkbox, tailElement, ontailclick}` |
| `file` | `boolean` | Tap the row to pick a **file** with Acode's file browser; the chosen URL becomes the value |
| `folder` | `boolean` | Same, for a folder |
| `color` | `boolean` | Tap the row to open the colour picker; cancels leave the value untouched |
| `link` | `string` | Tap the row to open the URL in the system browser. `cb` is **not** called |
| `info` | `string` | Subtitle text |
| `valueText` | `(value) => string` | Format `value` for display |
| `icon` | `string` | Icon-font class for the leading icon |
| `iconColor` | `string` | CSS colour used as a background swatch |
| `image` | `string` | Image URL rendered as the leading icon |
| `fileIcon` | `{name, kind}` | Resolve the leading icon through the icon-pack API |
| `category` | `string` | Group rows under a section label |
| `searchGroup` | `string` | Group label used in search results instead of the page title |
| `index` | `number` | Insert at this exact position, ignoring the sort |
| `chevron` | `boolean` | Force the trailing chevron |
| `sake` | `boolean` | Render in the grid/`sake` layout |
| `hidden` | `boolean` | Start hidden (also sets `aria-hidden`) |
| `note` | `string` | Not a row: an item carrying `note` is pulled out of the list and rendered as an info note above or below it |

Interaction handlers are tried in this order, and the **first** matching field wins:

1. `select` 2. `checkbox` 3. `prompt` 4. `file` / `folder` 5. `color` 6. `link` 7. none

A row with none of those still calls `cb(key, item.value)` with the **unchanged** value — that is the "tap to run code" pattern. Cancelling a prompt, the colour picker or opening a `link` skips `cb` entirely.

::: tip Use `prompt` for a simple settings row
This is the smallest complete plugin setting:

```js
{ key: 'host', text: 'Host', value: 'localhost', prompt: 'Server host' }
```
:::

## Complete plugin example <Badge type="tip" text="new" />

```js
// main.js
if (window.acode) {
	const settings = acode.require('settings');
	const toast = acode.require('toast');
	const storageKey = 'com.example.plugin';

	// 1. Backfill defaults at REGISTRATION time.
	//    settings.list is evaluated inside setPluginInit(), before init runs,
	//    so the values must exist before we build the rows.
	//    One namespaced top-level key keeps change detection and events simple.
	settings.value[storageKey] = {
		greeting: 'Hello',
		level: 'info',
		verbose: false,
		...(settings.value[storageKey] || {}),
	};
	const values = settings.value[storageKey];

	// 2. Mutating settings.value does not save or emit — persist silently.
	//    (The first call also writes the brand-new key to settings.json.)
	function save() {
		return settings.update(false);
	}

	// 3. React to Acode's own settings, and to our own key, from anywhere.
	function onFontSize(value) {
		console.log('Acode font size is now', value);
	}
	function onOwnValues(next) {
		console.log('plugin settings changed:', next);
	}
	settings.on('update:fontSize', onFontSize);
	settings.on(`update:${storageKey}`, onOwnValues);

	save(); // make sure our key is on disk

	acode.setPluginInit(
		storageKey,
		(baseUrl, $page) => {
			const greeting = tag('p', { innerHTML: values.greeting });
			const level = tag('small', { textContent: values.level });

			$page.appendBody(greeting, level);
		},
		{
			list: [
				{
					key: 'greeting',
					text: 'Greeting',
					value: values.greeting,
					prompt: 'Greeting shown on the plugin page',
					promptOptions: { required: true },
				},
				{
					key: 'level',
					text: 'Log level',
					value: values.level,
					select: ['debug', 'info', 'error'],
				},
				{
					key: 'verbose',
					text: 'Verbose logging',
					value: values.verbose,
				},
			],
			cb(key, value) {
				// The page has already updated its own copy of the row.
				values[key] = value;
				save().then(() => toast(`${key} saved`));
			},
		},
	);

	acode.setPluginUnmount(storageKey, () => {
		// off() needs the exact same function reference given to on()
		settings.off('update:fontSize', onFontSize);
		settings.off(`update:${storageKey}`, onOwnValues);
	});
}
```

::: warning `setPluginInit` evaluates `list` immediately
`settings.list` is read **inside** `setPluginInit`, long before your init callback runs. That is why the example above backfills `settings.value` and captures `values` at registration time. If you need rows derived from state created during init, build them yourself in the init callback and register your own page instead.
:::

::: tip The `cb` order
`settingsPage` updates `item.value` and re-renders the row **before** calling `cb(key, item.value)`, so the value you receive is the new one. A cancelled prompt, a cancelled colour picker, or a `link` row never reaches `cb`.
:::

## API Reference

### Methods

#### `get(key: string)`
Gets the value of a setting

Parameters:
- `key`: Name of the setting to get

Returns: The current value of the setting (`undefined` for unknown keys)

#### `update(settings?: object, showToast?: boolean, saveFile?: boolean): Promise<void>`
Updates one or more settings

Parameters:
- `settings`: Object containing settings to update. Only keys already in `settings.value` are applied
- `showToast`: Whether to show a confirmation toast (default: `true`)
- `saveFile`: Whether to write `settings.json` (default: `true`)

#### `reset(setting?: string): Promise<void | false>`
Resets settings to default values

Parameters:
- `setting`: Optional specific setting to reset. If omitted, resets all settings

Returns: `false` when `setting` is not a known Acode setting; otherwise `undefined`

#### `on(event: string, callback: Function)`
Adds an event listener

Parameters:
- `event`: Event name. Built-ins are `update`, `update:after` and `reset`; `update:<setting>` and `update:<setting>:after` are matched per setting
- `callback`: Function to call when event occurs. Receives the new value (`reset` receives the whole `settings.value`)

#### `off(event: string, callback: Function)`
Removes an event listener

Parameters:
- `event`: Event name
- `callback`: The **exact** function reference passed to `on()`