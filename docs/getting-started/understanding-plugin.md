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

1. Acode discovers plugin folders — one directory per plugin inside `PLUGIN_DIR`.
2. It decides which plugins to load (enabled, not broken, not already loaded, and non-theme for the first pass).
3. It appends a `<script>` tag for your entry script, which runs and calls `acode.setPluginInit` / `acode.setPluginUnmount`.
4. When that script finishes loading, Acode calls your registered `init` with runtime context and **awaits** it.
5. Before loading (and on disable/uninstall), Acode calls your registered `unmount`, if you registered one.

```text
www/index.html
  └─ build/boot.js ............. picks dev-server assets or ./build/main.css|main.js
       └─ app main.js
            ├─ window.PLUGIN_DIR    = DATA_STORAGE + "/plugins"
            ├─ window.CACHE_STORAGE = <cache dir>
            ├─ loadApp()  ...
            └─ setTimeout(500ms)
                 └─ loadPlugins() ......................... non-theme plugins
                      ├─ lsDir(PLUGIN_DIR)
                      ├─ toast("Loading plugins")
                      ├─ skip: LOADED / pluginsDisabled / BROKEN
                      ├─ loadPluginWithTimeout(id) ........ in parallel, one 15s timeout each
                      │    └─ loadPlugin(id)
                      │         ├─ await connect() ........ trusted native session
                      │         ├─ acode.unmountPlugin(id) .. OLD destroy() runs here
                      │         ├─ remove <script id="<id>-mainScript">
                      │         ├─ read PLUGIN_DIR/<id>/plugin.json
                      │         ├─ <script> appended → your main.js runs (registers init/unmount)
                      │         └─ onload:
                      │              ├─ create CACHE_STORAGE/<id> if missing
                      │              └─ acode.initPlugin(id, baseUrl, $page, options)
                      │                   └─ await #pluginsInit[id](baseUrl, $page, options)
                      │                        └─ LOADED_PLUGINS.add(id) + onPluginLoadCallback
                      └─ acode[onPluginsLoadCompleteCallback]()
            └─ loadPlugins(true) ......................... theme plugins only
```

## Boot Order: Discovery To Init <Badge type="tip" text="new" />

:::info
`build/boot.js` is the only script the HTML entry point loads directly. It never imports the app; it injects `build/main.css` and `build/main.js` (from the dev server in dev mode, from `./build/` otherwise). Everything below happens inside the app's `main.js`.
:::

**1. Discovery.** `loadPlugins()` lists `PLUGIN_DIR`. **The directory name *is* the plugin id** — every later lookup uses `Url.basename(dir.url)`, so the folder must match `plugin.json`'s `id`.

**2. Filtering.** A plugin is skipped when:

| Skip condition | Source |
| --- | --- |
| Already in `LOADED_PLUGINS` | `LOADED_PLUGINS` set |
| `settings.pluginsDisabled[id] === true` | the user's (or Acode's) disable flag |
| Present in `BROKEN_PLUGINS` | failed or timed-out this session |

The first pass (`loadPlugins()`) loads **non-theme** plugins only; a second pass (`loadPlugins(true)`) loads theme plugins. Theme plugins are detected by keyword matching against the plugin id (`theme`, `catppuccin`, `githubdark`, `synthwave`, `monokai`, …) — so an id containing one of those words is treated as a theme and is skipped by the first pass.

**3. Per-plugin load.** Each surviving plugin goes through `loadPluginWithTimeout()`, all in parallel, with a **15 s** budget. `loadPlugin()` then:

1. `await connect()` — establishes the trusted native session *before* any plugin script runs.
2. Calls `acode.unmountPlugin(pluginId)` so the *previous* version's `unmount` runs while it still exists (see [Disable / Enable / Uninstall](#what-happens-on-disable-enable-uninstall)).
3. Removes the old `<script id="<pluginId>-mainScript">` so the browser refetches the source.
4. Reads `PLUGIN_DIR/<id>/plugin.json` as JSON.
5. Uses `pluginJson.main` if that file exists in the folder, otherwise falls back to `main.js`.
6. Binds a plugin-scoped `fileIcons` API to the `<script>` element, then appends it.

Your `main.js` runs at this point and is expected to call `acode.setPluginInit(...)` / `acode.setPluginUnmount(...)`.

**4. Init.** On the script's `onload`, Acode creates the cache file if missing and calls `acode.initPlugin(pluginId, baseUrl, $page, options)`, which **awaits** your init callback.

**5. Completion.** A successful load adds the id to `LOADED_PLUGINS`, fires the per-plugin load callback, clears any stale broken mark, and — for a fresh install — clears the auto-disable flag. When the whole batch settles, `onPluginsLoadCompleteCallback` rejects any still-pending `waitForPlugin` waiters.

:::warning
Your `init` is awaited, so a slow `init` consumes part of the 15 s budget and delays `onPluginsLoadCompleteCallback` for *every* plugin. Register quickly and defer expensive work.
:::

## Where Your Plugin Files Live <Badge type="tip" text="new" />

| Path | What it is |
| --- | --- |
| `PLUGIN_DIR` | `DATA_STORAGE + "/plugins"`. Each plugin lives in `PLUGIN_DIR/<pluginId>/`. |
| `baseUrl` | Internal URL of `PLUGIN_DIR/<pluginId>`. **No trailing slash** — the loader does `Url.join(baseUrl, pluginJson.main)`, so `Url.join(baseUrl, "icons/x.svg")` is the correct way to build asset URLs. |
| `CACHE_STORAGE/<pluginId>` | A single **file** (not a directory), created by the loader if it does not exist. Exposed as `options.cacheFile` (filesystem handle) and `options.cacheFileUrl`. |

The cache file is deleted by `acode.unmountPlugin()` — and `unmountPlugin()` runs at the *start* of every load. Because `unmountPlugin()` only performs the delete when an unmount callback is registered, a plugin without `setPluginUnmount` keeps its cache file, while a plugin with one starts every load with an empty cache file.

:::warning
Treat `cacheFile` as scratch space only. It is deleted on unmount/reload; use `fs` inside `PLUGIN_DIR` or `acode.require("settings")` for anything that must survive.
:::

## What You Get In `init`

The `init` callback registered with `setPluginInit` receives three arguments:

- `baseUrl`: internal base URL to your plugin files (**no trailing slash** — the loader itself joins it with `pluginJson.main`, so use `Url.join(baseUrl, "icons/x.svg")`; the template adds the slash itself before storing it)
- `$page`: a plugin page object for UI screens. `$page.show()` appends it to the app and pushes `$page.hide` on the action stack; `$page.onhide` pops it.
- `options`: object with:
  - `cacheFileUrl`
  - `cacheFile`
  - `firstInit`
  - `ctx`
  - `fileIcons` — plugin-bound [File Icons](../utilities/file-icons.md) API. It is the same instance you get from `acode.require("fileIcons")` in the main script, and it stays bound across `await`s and callbacks. It is the *only* module that is per-plugin; every other `acode.require(...)` returns a shared global module.

Use `firstInit` for one-time setup or migration. It is `true` only when the plugin was just installed (`installPlugin` passes `justInstalled: true`), and `false` on every subsequent load, reload and re-enable.

`ctx` is your plugin's native-backed context: encrypted secret storage and permission checks. See [Plugin Context (`ctx`)](../plugin-essentials/plugin-context.md). It can be `null` if the trusted native session is unavailable, so guard it.

:::info
**Version numbers.** Acode v1.13.5 declares `android-versionCode="1011"` in `config.xml`. Only cite a versionCode you can point at in the app source or its `CHANGELOG.md`; the loader itself never checks `minVersionCode`, and the [File Icons](../utilities/file-icons.md) page is the reference for when that API became available.
:::

## Recommended `main.js` Shape

The official templates structure your plugin as an `AcodePlugin` class with `init()` and `destroy()`:

```js
import plugin from "../plugin.json";

class AcodePlugin {
	baseUrl = "";

	async init(_page, _cacheFile, _cacheFileUrl, _firstInit, _ctx, _fileIcons) {
		// plugin code
	}

	async destroy() {
		// plugin clean up
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

Breaking that down:

- `window.acode` is only present once Acode's API is ready, so registration is wrapped in a guard.
- `plugin.id` comes from your `plugin.json`, so the registration always matches the installed id.
- The `init` callback receives `(baseUrl, $page, options)`, where `options` is `{ cacheFileUrl, cacheFile, firstInit, ctx, fileIcons }`. Those are forwarded to your class's `init`. `fileIcons` is also available as `acode.require("fileIcons")` if you prefer to capture it in the main script — see [File Icons](../utilities/file-icons.md).
- `baseUrl` is stored with a guaranteed trailing slash so you can build file paths with `Url.join` or string concatenation.
- `destroy()` is wired to `setPluginUnmount` so it runs on disable/reload/uninstall. `init` is awaited, so heavy setup can be done inside it.

## The Init Contract <Badge type="tip" text="new" />

There are four functions in the contract. You call two of them; Acode calls the other two.

| Function | Caller | Signature |
| --- | --- | --- |
| `acode.setPluginInit` | you | `(id: string, init: (baseUrl, $page, options) => any, settings?: { list, cb })` |
| `acode.setPluginUnmount` | you | `(id: string, unmount: () => any)` |
| `acode.initPlugin` | Acode | `async (id, baseUrl, $page, options)` → `await #pluginsInit[id](baseUrl, $page, options)` |
| `acode.unmountPlugin` | Acode | `(id)` — calls the unmount callback synchronously, in a `try`/`catch` |

Key facts:

- **Registration happens in the main script, init runs later.** `setPluginInit` only stores your function in a map keyed by plugin id. If you never call it, `initPlugin` finds nothing and does nothing — your plugin is loaded but inert.
- **The third `setPluginInit` argument is optional.** Pass `{ list, cb }` and Acode builds a settings page for you, stored under `appSettings.uiSettings["plugin-<id>"]`; `unmountPlugin` deletes it. This is why plugin settings disappear on disable.
- **`initPlugin` awaits your init.** Returning a promise is the supported way to do async setup; the loader will not proceed until it settles.
- **`unmount` is not awaited.** `unmountPlugin()` is synchronous. If your cleanup is async, fire it and do not block on it.
- **A throwing unmount does not break unmounting.** It is caught and logged as `Error while calling unmount callback for plugin "<id>"`; the cache file, settings page and icon registrations are still cleaned up.

## What Happens On Disable / Enable / Uninstall

- Disable:
  - Acode flips `settings.pluginsDisabled[id] = true`, then calls `acode.unmountPlugin(id)` which triggers your registered unmount (your class's `destroy()`).
  - Plugin runtime state is cleared (including plugin cache file, the plugin settings page, and any File Icons packs it registered).
  - The plugin folder stays on disk. It is simply skipped on the next load.
- Enable:
  - Acode deletes the disable flag, then loads the plugin again and runs init again.
  - From the sidebar, the "more" menu offers **Restart App** or a **single** enable/disable; in Settings → Plugins the toggle is immediate.
- Uninstall:
  - The plugin folder (`PLUGIN_DIR/<id>`) and its install state are deleted, the `<script>` tag is removed, and `acode.unmountPlugin(id)` runs for anything still loaded.
- Reload / reinstall:
  - `loadPlugin()` calls `acode.unmountPlugin(pluginId)` **before** appending the new `<script>`. This is deliberate: once your new script runs it calls `setPluginUnmount(id, newDestroy)`, which would overwrite the old destroy callback and make it uncallable. Unmounting first guarantees the old version cleans up its sidebar app, commands and listeners.

Treat `init` as repeatable and `destroy` as mandatory cleanup.

## Failure Behavior You Should Know

If your plugin throws during load/init:

- it is added to the `BROKEN_PLUGINS` map (`{ error, timestamp }`) and recorded in `AUTO_DISABLED_PLUGINS`,
- Acode writes `pluginsDisabled[id] = true` in settings, so it appears switched off in the plugin list,
- it is skipped on every subsequent load pass until the mark is cleared,
- the other plugins keep loading — one failure never aborts the batch.

Two different failure shapes are reported:

```text
Failed to load script for plugin <id>: <error.message | error>   # <script> fetch/execute failed (loadPlugin)
Plugin load timeout                                              # init did not settle within 15s (loadPlugins)
Error loading plugin <id>: <error>                               # console.error from the batch loader
```

:::info
A timeout is not an immediate disable. At **15 s** the plugin is recorded in `BROKEN_PLUGINS` with the error `Plugin load timeout`, but loading continues in the background. At **60 s** in total, if the plugin still has not settled and is not in `LOADED_PLUGINS`, Acode marks it broken and auto-disables it. A plugin that settles in between still succeeds: its broken mark is cleared and it is marked loaded normally.
:::

### The retry / clear-broken-mark flow

```js
acode.clearBrokenPluginMark("com.example.plugin");   // deletes the BROKEN_PLUGINS entry only
```

`clearBrokenPluginMark()` is deliberately narrow: it removes the session mark so the next load pass considers the plugin again. It does **not** clear the disable flag that `markPluginBroken` wrote into settings, so on its own it is not enough. To retry a broken plugin:

1. Turn it back on in **Settings → Plugins** (or **Extensions** in the sidebar). That deletes `pluginsDisabled[id]`; the enable toggle in the Plugins page then calls `loadPlugin(id)` straight away.
2. Or reinstall it — `installPlugin()` loads with `justInstalled: true`, and a successful load clears both the broken mark and the auto-disable flag.

Once a load succeeds, `markPluginLoaded()` deletes the broken mark and, for a fresh install or an auto-disabled plugin, re-enables it.

## Waiting For Another Plugin <Badge type="tip" text="new" />

Plugins load **in parallel**, so your `init` may run before, after, or during another plugin's `init`. Never assume another plugin's API already exists at init time.

The loader keeps three pieces of state:

| State | Meaning |
| --- | --- |
| `LOADED_PLUGINS` | `Set` of plugin ids whose load completed successfully |
| `onPluginLoadCallback` | Fired with the id right after a successful load — resolves matching `waitForPlugin` waiters |
| `onPluginsLoadCompleteCallback` | Fired once the whole batch settles — **rejects** every still-pending `waitForPlugin` waiter with `` Plugin '<id>' failed to load. `` |

`acode.waitForPlugin(pluginId)` returns a promise that resolves `true` immediately if the plugin is already loaded, resolves `true` when it loads, and **rejects** if the batch finishes first without it. Full reference: [`acode.waitForPlugin`](../global-apis/acode.md).

```js
acode.setPluginInit(plugin.id, async (baseUrl, $page) => {
	try {
		await acode.waitForPlugin("com.example.other-plugin");
		// safe to use the other plugin's exports now
	} catch {
		// the other plugin is missing, broken or disabled — degrade gracefully
	}
});
```

:::tip
For non-critical cross-plugin wiring, the lazier option is to resolve the dependency **inside the command's `exec`**. By then every plugin has settled, and nothing you register can fail at load time.
:::

## Update Checks <Badge type="tip" text="new" />

Once per app start, after the app update check, Acode lazily imports `lib/checkPluginsUpdate` and runs it. For every directory in `PLUGIN_DIR` it:

1. reads `plugin.json`,
2. requests `GET {API_BASE}/plugin/check-update/<id>/<version>`,
3. if the response is OK and says an update exists, prefers `json.version` and compares it with the installed version; otherwise it falls back to fetching `{API_BASE}/plugin/<id>` and comparing that `version`,
4. collects the ids where `isVersionGreater(remote, local)` is true.

Per-plugin failures are swallowed (`Promise.allSettled`), so one bad plugin never hides the others.

What the user sees:

- A notification titled **Plugin Updates** with the body *"1 plugin has a new version available."* or *"{count} plugins have new versions available."*
- Tapping it opens the Plugins page filtered to exactly those ids; from there each plugin shows an **Update** action instead of the enable/disable toggle.

:::warning
The check queries the Acode registry only. A plugin you installed from your own zip URL or a local file is compared against the registry entry with the same id — if there is none, no update is ever reported. It also runs once per app start; there is no background polling.
:::

## Lifecycle Cheat Sheet <Badge type="tip" text="new" />

| Hook | When | What to do |
| --- | --- | --- |
| main script body | The `<script>` tag executes, before `init` | Register `init`/`unmount`; grab per-plugin APIs synchronously (e.g. `acode.require("fileIcons")`) |
| `init(baseUrl, $page, options)` | Once per successful load, **awaited** by the loader | Register commands, sidebar apps, UI hooks. Return early and defer heavy work |
| `options.firstInit` | `true` only on a fresh install | One-time setup, migrations, seeding defaults |
| `options.cacheFile` | Created before `init`, deleted on unmount | Scratch data only |
| `options.ctx` | Available at `init`, may be `null` | Secrets/permissions — guard for `null` |
| `destroy()` / unmount | Before a reload, and on disable / uninstall | Remove commands, listeners, intervals, dispose icon registrations |
| `acode.waitForPlugin(id)` | When your plugin needs another plugin | Gate cross-plugin use; always `.catch()` |
| `commands.removeCommand(name)` | In `destroy` | Register with `acode.require("commands")`, unregister by the same `name` |

## Troubleshooting <Badge type="tip" text="new" />

### My plugin doesn't load at all

- `plugin.json` must sit at the **root** of the zip. The installer reads `zip.files["plugin.json"]` and throws `Invalid Plugin` otherwise.
- The zip **must** contain the file named by `main`. The installer patches `main` to `main.js` when that entry is missing and rewrites `plugin.json` with the patch, then throws `Invalid Plugin` if `main.js` is missing too. `loadPlugin()` applies the same `main` → `main.js` fallback, so a `main` pointing at a file that is not in the folder produces a `Failed to load script for plugin <id>` error instead of a clear message.
- The **folder name must equal `plugin.json`'s `id`**. Discovery uses `Url.basename(dir.url)` as the id everywhere.
- The plugin may simply be disabled: `pluginsDisabled[id] === true` (user toggle, or auto-disabled after a failure) makes it skip silently.
- If it is a theme-looking id (contains `theme`, `monokai`, `synthwave`, …) it is skipped by the first load pass and only loaded by the theme pass.
- `minVersionCode` is **not** checked by the loader. It is only used by the plugin page, which reads the registry's `min_version_code` and shows *"… only available in Acode - {v-code} and above. Click here to update."* when your build is older.

### My plugin throws while loading

Look for the loader's exact messages:

```text
Failed to load script for plugin <id>: <error.message | error>
Plugin load timeout
Error loading plugin <id>: <error>
```

Remember that the failing plugin is auto-disabled and marked broken — after fixing the cause, re-enable it or reinstall it (see [the retry flow](#the-retry-clear-broken-mark-flow)).

### My command doesn't show up / does nothing

- `commands.addCommand` is a no-op with a warning if `name` is missing (`Command registration skipped: missing name`) or if `exec` isn't a function (``Command registration skipped for "<name>": exec must be a function.``).
- If the registration itself throws, `Failed to add command <name>` is logged and the error is re-thrown — so an exception in `init` right after `addCommand` will abort the rest of your init.
- `requiresView` defaults to **`true`**, so a command that runs with no active editor view resolves to `false` and appears to do nothing. Pass `requiresView: false` for commands that do not need a view.
- Throwing inside `exec` is caught and logged as `Command "<name>" failed`.
- Registering the same `name` twice **replaces** the earlier registration rather than erroring — which is exactly what happens when a plugin reloads without the old registration being removed.

### `ctx` is `null`

If the trusted native session cannot be established, Acode logs `PluginContext creation failed for pluginId <id>: no trusted session` and passes `null`. Treat `ctx` as optional:

```js
acode.setPluginInit(plugin.id, async (baseUrl, $page, { ctx }) => {
	if (!ctx) return; // secrets/permissions unavailable
});
```

### Another plugin's commands aren't registered yet at init time

This is expected — plugins load in parallel. Two fixes:

```js
// 1. wait for the dependency (and always catch: it may never load)
await acode.waitForPlugin("com.example.other-plugin");

// 2. or resolve lazily, at the moment you actually need it
acode.setPluginInit(plugin.id, async (baseUrl, $page) => {
	const commands = acode.require("commands");

	commands.addCommand({
		name: "example.use-other",
		exec: async () => {
			await acode.waitForPlugin("com.example.other-plugin");
			// ... the other plugin's API is guaranteed to be ready here
		},
	});
});
```

`acode.require("commands")` itself is always available (it is registered on the `acode` instance at construction), so the race is only ever about *other plugins*, never about core modules.

## Where This Behavior Lives <Badge type="tip" text="new" />

Every statement above is taken from the Acode app source, so you can verify it against your own build:

| Concern | File |
| --- | --- |
| App entry, plugin loading trigger, update check, notifications | `src/main.js`, `src/boot.js` |
| Discovery, filtering, parallel load, timeouts, broken/auto-disable bookkeeping | `src/lib/loadPlugins.js` |
| Per-plugin load, `plugin.json` read, `<script>` injection, `initPlugin` call | `src/lib/loadPlugin.js` |
| `setPluginInit` / `initPlugin` / `setPluginUnmount` / `unmountPlugin` / `waitForPlugin` / `clearBrokenPluginMark` | `src/lib/acode.js` |
| Zip layout, manifest patching, install-state cleanup, dependencies | `src/lib/installPlugin.js` |
| Registry update detection | `src/lib/checkPluginsUpdate.js` |
| Registry base URL and app constants | `src/lib/config.js` |

## Author Guidelines

- Keep `init` fast; do heavy work lazily.
- Register commands through `acode.require("commands")`.
- Always remove listeners, commands, intervals, and UI hooks in `destroy`.
- Avoid storing important state only in memory; use cache/settings when needed.
