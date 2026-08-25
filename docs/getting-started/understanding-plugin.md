# Understanding How Plugins Work

This page is the practical mental model for writing Acode plugins: what Acode does, what your plugin must do, and what happens during load/unload.

## The Plugin Contract

From Acode's perspective, your plugin is:

1. A folder in `PLUGIN_DIR`
2. A `plugin.json`
3. An entry script (usually `main.js`)

From your perspective, your script should register:

- `acode.setPluginInit(pluginId, initFn)`
- `acode.setPluginUnmount(pluginId, unmountFn)` (strongly recommended)

If you skip `setPluginInit`, your script may load, but your plugin logic will not run through Acode's lifecycle.

## Lifecycle In One View

1. Acode discovers plugin folders.
2. It decides which plugins to load (enabled, not broken, not already loaded).
3. It loads your entry script.
4. It calls your registered `init` with runtime context.
5. Later, on disable/uninstall/reload, it calls your registered `unmount`.

## What You Get In `init`

The `init` callback registered with `setPluginInit` receives three arguments:

- `baseUrl`: internal base URL to your plugin files (normalize it with a trailing slash, see below)
- `$page`: a plugin page object for UI screens
- `options`: object with:
  - `cacheFileUrl`
  - `cacheFile`
  - `firstInit`
  - `ctx`

Use `firstInit` for one-time setup or migration.

`ctx` is your plugin's native-backed context: encrypted secret storage and permission checks. See [Plugin Context (`ctx`)](../plugin-essentials/plugin-context.md).

## Recommended `main.js` Shape

The official templates structure your plugin as an `AcodePlugin` class with `init()` and `destroy()`:

```js
import plugin from "../plugin.json";

class AcodePlugin {
	baseUrl = "";

	async init(_page, _cacheFile, _cacheFileUrl, _firstInit, _ctx) {
		// plugin code
	}

	async destroy() {
		// plugin clean up
	}
}

if (window.acode) {
	const acodePlugin = new AcodePlugin();

	acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile, firstInit, ctx }) => {
		acodePlugin.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
		await acodePlugin.init($page, cacheFile, cacheFileUrl, firstInit, ctx);
	});

	acode.setPluginUnmount(plugin.id, () => {
		acodePlugin.destroy();
	});
}
```

Breaking that down:

- `window.acode` is only present once Acode's API is ready, so registration is wrapped in a guard.
- `plugin.id` comes from your `plugin.json`, so the registration always matches the installed id.
- The `init` callback receives `(baseUrl, $page, options)`, where `options` is `{ cacheFileUrl, cacheFile, firstInit, ctx }`. Those are forwarded to your class's `init`.
- `baseUrl` is stored with a guaranteed trailing slash so you can build file paths with `Url.join` or string concatenation.
- `destroy()` is wired to `setPluginUnmount` so it runs on disable/reload/uninstall. `init` is awaited, so heavy setup can be done inside it.

## What Happens On Disable / Enable / Uninstall

- Disable:
  - Acode calls `acode.unmountPlugin(id)` which triggers your registered unmount (your class's `destroy()`).
  - Plugin runtime state is cleared (including plugin cache file).
- Enable:
  - Acode loads the plugin again and runs init again.
- Uninstall:
  - Plugin files are removed.
  - Acode runs unmount cleanup for loaded resources.

Treat `init` as repeatable and `destroy` as mandatory cleanup.

## Failure Behavior You Should Know

If your plugin throws during load/init:

- it is marked as broken for the session flow,
- Acode skips loading it again until user/action retries it.

For programmatic recovery:

```js
acode.clearBrokenPluginMark("com.example.plugin");
```

## Author Guidelines

- Keep `init` fast; do heavy work lazily.
- Register commands through `acode.require("commands")`.
- Always remove listeners, commands, intervals, and UI hooks in `destroy`.
- Avoid storing important state only in memory; use cache/settings when needed.
