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

Your init function receives:

- `baseUrl`: internal base URL to your plugin files
- `$page`: a plugin page object for UI screens
- `cache`: object with:
  - `cacheFileUrl`
  - `cacheFile`
  - `firstInit`
  - `ctx`

Use `firstInit` for one-time setup or migration.

## Recommended `main.js` Shape

```js
import plugin from "../plugin.json";

function init(baseUrl, $page, cache) {
  const commands = acode.require("commands");

  commands.addCommand({
    name: "example.open",
    description: "Open Example Panel",
    exec: () => {
      $page.innerHTML = "<h2>Example Plugin</h2>";
      $page.show();
    },
  });
}

function unmount() {
  const commands = acode.require("commands");
  commands.removeCommand("example.open");
}

acode.setPluginInit(plugin.id, init);
acode.setPluginUnmount(plugin.id, unmount);
```

## What Happens On Disable / Enable / Uninstall

- Disable:
  - Acode calls `acode.unmountPlugin(id)` which triggers your unmount.
  - Plugin runtime state is cleared (including plugin cache file).
- Enable:
  - Acode loads the plugin again and runs init again.
- Uninstall:
  - Plugin files are removed.
  - Acode runs unmount cleanup for loaded resources.

Treat `init` as repeatable and `unmount` as mandatory cleanup.

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
- Always remove listeners, commands, intervals, and UI hooks in `unmount`.
- Avoid storing important state only in memory; use cache/settings when needed.
