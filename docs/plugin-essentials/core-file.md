# Plugin Main File

The `main.js`(can be of any name but that must be specified in `plugin.json`) file is the heart of your Acode plugin, serving as the entry point and execution hub when the plugin is loaded. Here we'll explore the essential concept of `main.js`, focusing on initialization, registration, and cleanup.

For loader behavior and runtime lifecycle details, see [Understanding Plugin Lifecycle](../getting-started/understanding-plugin.md).

## Plugin Initialization

### Entry Point for Your Plugin

The `main.js` file acts as the entry point for your Acode plugin. It is executed upon loading, providing the ideal space to initialize and configure your plugin.

### Access to Acode API

Within `main.js`, you gain access to the Acode API through the global variable [acode](../global-apis/acode). This variable serves as your gateway to interact with various Acode methods, enabling seamless integration of your plugin with the editor.

### Registering Your Plugin

To register your plugin, utilize the `acode.setPluginInit(pluginId: string, init: Function, settings?: Object)` method. This method requires at least two parameters:

1. **pluginId:**
   - The unique identifier for your plugin.

2. **init function:**
   - The function to be executed when the plugin is loaded.

3. **settings (optional):**
   - A `{ list, cb }` object that creates a settings page for your plugin. See [Plugin settings page](#plugin-settings-page) below.

Acode invokes the registered function through `acode.initPlugin(id, baseUrl, $page, options)`, and the call is **`await`ed** - so a throwing or rejecting `init` fails the whole plugin load (the loader then unregisters the plugin's file icons and rejects).

Upon execution, the `init` function will receive **exactly three arguments**:

| # | Name | Type | Meaning |
| --- | --- | --- | --- |
| 1 | `baseUrl` | `string` | Internal URL of your plugin folder (`Url.join(PLUGIN_DIR, pluginId)`, converted with `helpers.toInternalUri`). **No trailing slash.** |
| 2 | `$page` | `WcPage` | A page object for plugin UI. `Page("Plugin")` with `show()` (pushes onto the action stack and appends to `app`) and `onhide` already wired up for you. |
| 3 | `options` | `object` | Runtime options, see below. |

The third argument is a plain object built by the loader in `src/lib/loadPlugin.js`, with exactly these five keys:

| Key | Type | Meaning |
| --- | --- | --- |
| `fileIcons` | `object` | Plugin-bound [File Icons](../utilities/file-icons.md) API (`register`, `icon`, `onChange`) - the same frozen object you get from `acode.require("fileIcons")` in the main script. Present in **v1.13.5 (versionCode `1011`)**. |
| `cacheFileUrl` | `string` | Internal URL of your plugin's cache file at `CACHE_STORAGE/<pluginId>`. |
| `cacheFile` | `File` | A `fileSystem` handle for that same cache file; created for you if missing. Use it for scratch state, not secrets. |
| `firstInit` | `boolean` | `true` only on the load that immediately follows an install/update; `false` on every later load, including after a restart. |
| `ctx` | `PluginContext \| null` | Your plugin's native context - encrypted secrets and permission echoes. **May be `null`.** See [Plugin Context (`ctx`)](./plugin-context.md). |

::: warning The argument order in the class template is the template's own convention
`init($page, cacheFile, cacheFileUrl, firstInit, ctx, fileIcons)` is **not** Acode's signature - it is how the official templates choose to forward the values into their `AcodePlugin` class, and note they deliberately put `cacheFile` *before* `cacheFileUrl`. Acode's contract is always `(baseUrl, $page, options)`. If you write the class yourself, name the parameters after the `options` object above to avoid confusion.
:::

### Accessing plugin-relative files

`baseUrl` points at your plugin folder **without** a trailing slash, so always normalise it once:

```js
const baseUrlWithSlash = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
const iconUrl = `${baseUrlWithSlash}icons/logo.svg`;
```

For reading packaged **JSON**, use the filesystem path rather than `fetch`:

```js
const fs = acode.require("fs");
const Url = acode.require("Url");
const fileIconsJson = await fs(Url.join(PLUGIN_DIR, plugin.id, "file_icons.json")).readFile("json");
```

::: warning `import plugin from "../plugin.json"` is a build-time feature
The loader injects your entry file as a **classic** script - it creates `<script id="${pluginId}-mainScript" src={mainUrl}>` and calls `document.head.append($script)` in `src/lib/loadPlugin.js`, with no `type="module"`. A raw `import` statement would be a syntax error at runtime, so in the official templates `../plugin.json` is resolved by the **bundler at build time** and inlined into the bundle.

That is why the path is relative: it is relative to the *source* file inside your project, not to the installed folder. In the official template the source lives at `src/main.js` while `plugin.json` sits at the project root, so exactly one `../` is needed - and `main` then points at the built file (`dist/main.js`). If you hand-write a plain `main.js` with no bundler, inline your id as a string instead:

```js
if (window.acode) {
  acode.setPluginInit("com.example.plugin", (baseUrl, $page) => {
    /* ... */
  });
}
```

Acode never reads the id out of your script - it uses the folder name and `plugin.json`.
:::

### Example main.js File

The official templates structure the plugin as an `AcodePlugin` class. Here is an illustrative example of a `main.js` file:

```javascript
import plugin from "../plugin.json";

class AcodePlugin {
	baseUrl = "";

	async init($page, cacheFile, cacheFileUrl, firstInit, ctx, fileIcons) {
		const commands = acode.require("commands");
		commands.addCommand({
			name: "example-plugin",
			bindKey: { win: "Ctrl-Alt-E", mac: "Command-Alt-E" },
			exec: () => {
				$page.innerHTML = `
          <h1>Example Plugin</h1>
          <p>This is an example plugin.</p>
        `;
				$page.show();
			},
		});
	}

	async destroy() {
		const commands = acode.require("commands");
		commands.removeCommand("example-plugin");
	}
}

if (window.acode) {
	const acodePlugin = new AcodePlugin();

	acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile, firstInit, ctx, fileIcons }) => {
		acodePlugin.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
		await acodePlugin.init($page, cacheFile, cacheFileUrl, firstInit, ctx, fileIcons);
	});

	acode.setPluginUnmount(plugin.id, () => {
		acodePlugin.destroy();
	});
}
```

## Complete runnable `main.js` <Badge type="tip" text="new" />

This is the whole entry file: the template's `plugin.json` import, a guarded registration, one command, a settings page, and real cleanup. (If you are not using the official bundler, drop the `import` and inline `"com.example.plugin"` - see [Accessing plugin-relative files](#accessing-plugin-relative-files).)

```js
import plugin from "../plugin.json";

class AcodePlugin {
	baseUrl = "";
	$page = null;
	commands = null;
	ticker = null;

	async init($page, cacheFile, cacheFileUrl, firstInit, ctx) {
		this.$page = $page;
		this.commands = acode.require("commands");

		// Scratch state survives restarts in CACHE_STORAGE/<pluginId>.
		if (firstInit) {
			await cacheFile.writeFile(JSON.stringify({ runs: 0 }));
		}

		const state = JSON.parse((await cacheFile.readFile("utf8")) || "{}");
		state.runs = (state.runs || 0) + 1;
		await cacheFile.writeFile(JSON.stringify(state));

		this.commands.addCommand({
			name: "example-plugin.show",
			description: "Example Plugin: open the demo page",
			bindKey: { win: "Ctrl-Alt-E", mac: "Command-Alt-E" },
			exec: () => this.showPage(),
		});

		// Stop doing background work when the plugin goes away.
		this.ticker = setInterval(() => console.log("tick", plugin.id), 60000);
	}

	showPage() {
		this.$page.innerHTML = `
			<h1>Example Plugin</h1>
			<p>Loaded ${this.baseUrl}</p>
		`;
		this.$page.show();
	}

	async destroy() {
		this.commands?.removeCommand("example-plugin.show");
		clearInterval(this.ticker);
		this.ticker = null;
	}
}

if (window.acode) {
	const acodePlugin = new AcodePlugin();

	acode.setPluginInit(
		plugin.id,
		async (baseUrl, $page, { cacheFileUrl, cacheFile, firstInit, ctx }) => {
			// baseUrl has no trailing slash - normalise once, then reuse.
			acodePlugin.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
			await acodePlugin.init($page, cacheFile, cacheFileUrl, firstInit, ctx);
		},
		{
			list: [
				{
					key: "greeting",
					text: "Greeting",
					value: "Hello",
					prompt: "Enter a greeting",
					promptType: "text",
				},
				{ key: "verbose", text: "Verbose logging", checkbox: true, value: false },
			],
			cb(key, value) {
				console.log(`${plugin.id} setting changed:`, key, value);
			},
		},
	);

	acode.setPluginUnmount(plugin.id, () => acodePlugin.destroy());
}
```

## Plugin settings page <Badge type="tip" text="new" />

The optional third argument of `acode.setPluginInit` builds a settings page for your plugin. Acode stores it in `appSettings.uiSettings["plugin-<id>"]` and then renders a **gear icon in your plugin's page header** that opens it - so the page is reachable from the plugin details page, not from Acode's main Settings list.

The shape is exactly `{ list, cb }`:

| Property | Type | Meaning |
| --- | --- | --- |
| `list` | `ListItem[]` | The rows to show, rendered in the order you supply. Each item needs at least `key` and `text`. |
| `cb` | `(key, value) => void` | Called after every change, with the row's `key` and its new value. Cancelled dialogs do not call it. Persist the value yourself - e.g. `acode.require("settings").update({ ... })`. |

The `ListItem` fields, and what tapping a row does:

| Field | Effect |
| --- | --- |
| `checkbox: true` (or a boolean `value`) | Renders a switch and toggles the boolean. |
| `select: [...]` | Opens a select dialog with those options. |
| `prompt: "<message>"` | Opens a prompt dialog. Note `prompt` is the **message string**, not a flag. `promptType` picks the input type (`"text"`, `"number"`, `"tel"`, `"search"`, `"email"`, `"url"`, `"textarea"`) and `promptOptions` adds `{ match, required, placeholder, test }`. |
| `file: true` / `folder: true` | Opens the file browser and stores the picked URL. |
| `color: true` | Opens the colour picker. |
| `link: "<url>"` | Opens the URL in the system browser. |
| `value` | Shown in the row's trailing position, and passed as the default into the dialog. |
| `valueText: (value) => string` | Formats `value` for display. |
| `icon`, `iconColor`, `image`, `fileIcon`, `info`, `category`, `hidden`, `chevron` | Appearance and grouping only. |

The page is created with `preserveOrder: true` and `groupByDefault: true`, so your item order is preserved and uncategorised rows are wrapped in a default group. Give items a `category` if you want explicit headings.

```js
acode.setPluginInit(
  plugin.id,
  async (baseUrl, $page) => {
    /* ... */
  },
  {
    list: [
      {
        key: "theme",
        text: "Theme",
        select: ["system", "light", "dark"],
        value: "system",
      },
      { key: "autosave", text: "Autosave", checkbox: true, value: true },
      {
        key: "interval",
        text: "Refresh interval",
        prompt: "Seconds between refreshes",
        promptType: "number",
        value: 30,
      },
    ],
    cb(key, value) {
      // Persist and apply.
    },
  },
);
```

::: tip
Acode deletes `uiSettings["plugin-<id>"]` for you on unmount, so you never have to tear the page down manually.
:::

## Plugin Unmount Function

The `main.js` file must also define cleanup logic, which is called when the plugin is unloaded or uninstalled. This cleanup allows you to remove listeners, commands, intervals, and UI hooks associated with your plugin. In the class template this lives in the `destroy()` method, registered via `acode.setPluginUnmount`.

### Example Unmount Function

```javascript
acode.setPluginUnmount(plugin.id, () => {
  const commands = acode.require("commands");
  commands.removeCommand('example-plugin');
});
```

In this example, the unmount function removes the 'example-plugin' command, ensuring that the plugin's impact on Acode is cleanly reverted upon unloading.

### When unmount runs

`acode.unmountPlugin(id)` invokes your function, and Acode calls it from three places:

- **Disable** from the Extensions screen (`src/sidebarApps/extensions/index.js`).
- **Uninstall** (`src/pages/plugin/plugin.js`), right after the plugin folder is deleted.
- **Reload / update of the plugin** (`src/lib/loadPlugin.js`) - `loadPlugin` calls `acode.unmountPlugin(pluginId)` *before* it appends the new `<script>`. That is deliberate: once the new script runs it overwrites `setPluginUnmount` with the new `destroy`, so the old one would be lost forever. Your unmount therefore always runs **before** the next `init`, and never twice for one load.

`unmountPlugin` wraps your callback in `try`/`catch` and only logs failures, so a throwing `destroy()` cannot break the surrounding unload.

### What Acode already cleans up for you

`acode.unmountPlugin(id)` does three things beyond calling your callback:

- **Deletes your cache directory**: `fsOperation(Url.join(CACHE_STORAGE, id)).delete()` - everything you wrote through `cacheFile` is gone. This one only runs when an unmount callback is registered for your id.
- **Removes your settings page**: `delete appSettings.uiSettings["plugin-<id>"]`.
- **Unregisters your file icon packs** and their subscriptions, scoped to your plugin id.

The last two run on every `unmountPlugin(id)` call, even for a plugin that never registered an unmount function.

The old `<script>` tag is also removed by the loader on the next load (`src/lib/loadPlugin.js`), so you are not left with duplicate script nodes.

### What only you can clean up

Everything else you registered by hand survives unmount and will keep running against a plugin Acode considers unloaded:

- Commands (`commands.removeCommand(name)`)
- Event listeners on `document` / `window` / `editorManager` / `app`
- Timers (`setInterval`, `setTimeout`), observers (`MutationObserver`), and sockets/web workers you opened
- DOM nodes you appended (your page elements, injected stylesheets)
- Sidebar apps, side buttons, selection-menu items, context-menu entries
- Formatters (`acode.unregisterFormatter(id)`), file handlers (`acode.unregisterFileHandler(id)`), file-icon registrations you hold a handle to (`registration.dispose()`), language modes, terminal themes

::: tip
For command registration APIs, see [Commands](../utilities/commands.md).
:::

:::tip
You will not need to write these `init`/`destroy` registration functions for your plugin because the templates ship with them. You only need to write your plugin code inside the `AcodePlugin` class.
:::

## Common mistakes / gotchas <Badge type="tip" text="new" />

- **Forgetting the trailing slash on `baseUrl`.** `baseUrl` is `Url.join(PLUGIN_DIR, pluginId)` with **no** trailing slash. `${baseUrl}icons/x.svg` silently becomes `.../com.example.pluginicons/x.svg`. Normalise once with `baseUrl.endsWith("/") ? baseUrl : \`${baseUrl}/\`` and reuse it.
- **Not guarding on `window.acode`.** The global is only present once Acode's API object exists. Register inside `if (window.acode) { ... }`, and `require("fileIcons")` synchronously in the main script - never from a timer or after an `await`, or the loader will not recognise the calling script and will throw.
- **Not removing commands on unmount.** Leftover commands keep a stale `exec` closure alive, so re-enabling the plugin registers a second command under the same name.
- **Treating the class-template parameter order as the API.** Acode always calls `(baseUrl, $page, options)`. Destructuring `$page` out of `options`, or assuming `cacheFileUrl` comes before `cacheFile` in a positional signature, will bite you.
- **Assuming `firstInit` is true on every launch.** It is `true` only for the load right after an install or update (`justInstalled`), and `false` afterwards - including app restarts.
- **Assuming `ctx` is always an object.** It can be `null` when the trusted native session is unavailable, and every method on it can reject. Guard it and wrap calls in `try`/`catch`.
- **Putting secrets in `cacheFile`.** The cache file is plain storage and it is deleted on unmount. Use [`ctx`](./plugin-context.md).
- **Throwing inside `init`.** `initPlugin` awaits your function, so a rejection fails the whole plugin load: Acode unregisters your file icons and marks the plugin broken, and it will be skipped until the user re-enables it or you clear the mark with `acode.clearBrokenPluginMark(id)`.
- **Relying on a throw inside `destroy()` to signal failure.** It is swallowed and logged.
- **Assuming a renamed file is picked up.** If you change `main` in `plugin.json`, the loader checks whether the new path exists in the folder and otherwise falls back to `main.js` (`src/lib/loadPlugin.js`) - so a stale build can keep running the old entry point.

## Signature reference <Badge type="tip" text="new" />

| Method | Signature | Called by | Behaviour |
| --- | --- | --- | --- |
| `acode.setPluginInit` | `(id: string, init: (baseUrl, $page, options) => void \| Promise<void>, settings?: { list, cb })` | You | Stores the init function under `id`. With `settings`, also builds `appSettings.uiSettings["plugin-<id>"]`. Returns nothing; calling it twice replaces both. |
| `acode.setPluginUnmount` | `(id: string, unmount: () => void)` | You | Stores the unmount function under `id`. Returns nothing; calling it twice replaces the previous one. |
| `acode.initPlugin` | `async (id, baseUrl, $page, options)` | The loader | Awaits your init function, but **only if** `id` is registered - otherwise it is a silent no-op. |
| `acode.unmountPlugin` | `(id: string) => void` | Acode (disable, uninstall, reload) | Calls your unmount function in `try`/`catch`, deletes `CACHE_STORAGE/<id>`, removes `uiSettings["plugin-<id>"]`, and unregisters the plugin's file icons. |

::: tip
`initPlugin` doing nothing for an unregistered id is why a `main.js` that forgets `setPluginInit` still loads without error but never runs. If your plugin seems inert, check that registration happened inside the `window.acode` guard.
:::

## Related

- [Plugin Context (`ctx`)](./plugin-context.md) - `options.ctx`, secrets and permissions
- [Manifest (`plugin.json`)](./manifest.md) - the `main`, `id` and `minVersionCode` attributes used above
- [Commands](../utilities/commands.md) - `addCommand` / `removeCommand`
- [File Icons](../utilities/file-icons.md) - `options.fileIcons`
- [File System (`fs`)](../utilities/fs.md) - reading packaged JSON
- [Understanding How Plugins Work](../getting-started/understanding-plugin.md) - loader and failure behaviour
