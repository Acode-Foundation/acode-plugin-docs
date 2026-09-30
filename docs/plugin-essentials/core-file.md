---
title: Core File (main.js)
description: The entry point of a plugin - how to register init and unmount handlers.
---

# Core File: `main.js`

The core file is the script Acode runs when your plugin loads. It can have any name and location, as long as `plugin.json` points to it with the [`main`](./manifest.md#main) field.

It has two jobs:

1. **Register** an `init` function that starts your plugin.
2. **Register** an `unmount` function that undoes everything `init` did.

For when and how Acode calls them, see [Understanding Plugins](../getting-started/understanding-plugin.md).

::: tip You rarely write this by hand
The [official templates](../getting-started/create-plugin.md#templates) already contain the registration code below. You only fill in the `init` and `destroy` methods of the `AcodePlugin` class.
:::

## Register the plugin

Your script has access to the global [`acode`](../global-apis/acode.md) object. Register the init function with `acode.setPluginInit`:

```js
acode.setPluginInit(pluginId, init, settings?)
```

| Parameter | Description |
| --- | --- |
| `pluginId` | The `id` from your `plugin.json`. |
| `init` | Function Acode calls to start the plugin. |
| `settings` | Optional. Adds a settings page for your plugin. See [Plugin settings](../global-apis/acode.md#plugin-settings). |

### `init` arguments

`init` receives three arguments:

| Argument | Type | Description |
| --- | --- | --- |
| `baseUrl` | `string` | URL of your plugin folder, for loading bundled files. |
| `$page` | [`Page`](../editor-components/page.md) | A blank page for your UI. Call `$page.show()` to open it. |
| `options` | `object` | Extra information, described below. |

`options` contains:

| Property | Description |
| --- | --- |
| `cacheFileUrl` | URL of your plugin's cache file. |
| `cacheFile` | File object for the cache file, so you can read and write it. |
| `firstInit` | `true` only on the run right after installation. |
| `ctx` | Encrypted secret storage and permission checks. See [Plugin Context](./plugin-context.md). |
| `fileIcons` | Plugin-bound [File Icons](../utilities/file-icons.md) API. Available from versionCode `1012`. |

Every property is documented in more detail under [`acode.setPluginInit`](../global-apis/acode.md#init-arguments).

## Register the unmount handler

```js
acode.setPluginUnmount(pluginId, unmount)
```

Acode calls `unmount` when the plugin is disabled, uninstalled or reloaded. Use it to remove everything you added: commands, event listeners, timers, UI elements and formatters. Anything left behind stays active until Acode restarts.

::: warning
Do not skip this. A plugin that does not clean up will leave duplicate commands and listeners behind every time it is reloaded during development.
:::

## Full example

This is the shape used by the official templates:

```js
import plugin from "../plugin.json";

class AcodePlugin {
  baseUrl = "";

  async init($page, cacheFile, cacheFileUrl, firstInit, ctx, fileIcons) {
    const commands = acode.require("commands");

    commands.addCommand({
      name: "example-plugin",
      description: "Open the example plugin",
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

  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, { cacheFileUrl, cacheFile, firstInit, ctx, fileIcons }) => {
      // Make sure baseUrl ends with "/" so you can append file names to it
      acodePlugin.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      await acodePlugin.init($page, cacheFile, cacheFileUrl, firstInit, ctx, fileIcons);
    },
  );

  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
```

The `if (window.acode)` check lets the same bundle be loaded outside Acode (for example in tests) without throwing.

## Related

- [Commands](../utilities/commands.md): register editor commands
- [Understanding Plugins](../getting-started/understanding-plugin.md): lifecycle details
