# Plugin Main File

The `main.js`(can be of any name but that must be specified in `plugin.json`) file is the heart of your Acode plugin, serving as the entry point and execution hub when the plugin is loaded. Here we'll explore the essential concept of `main.js`, focusing on initialization, registration, and cleanup.

For loader behavior and runtime lifecycle details, see [Understanding Plugin Lifecycle](../getting-started/understanding-plugin.md).

## Plugin Initialization

### Entry Point for Your Plugin

The `main.js` file acts as the entry point for your Acode plugin. It is executed upon loading, providing the ideal space to initialize and configure your plugin.

### Access to Acode API

Within `main.js`, you gain access to the Acode API through the global variable [acode](../global-apis/acode). This variable serves as your gateway to interact with various Acode methods, enabling seamless integration of your plugin with the editor.

### Registering Your Plugin

To register your plugin, utilize the `acode.setPluginInit(pluginId: string, init: Function)` method. This method requires two parameters:

1. **pluginId:**
   - The unique identifier for your plugin.

2. **init function:**
   - The function to be executed when the plugin is loaded.

Upon execution, the `init` function will receive three arguments:

- **baseUrl (string):**
  - The base URL of the plugin, allowing access to files within the plugin directory.

- **$page (WcPage):**
  - A page object that facilitates the display of content within Acode.

- **cache (object):**
  - An object providing access to cached files, including:
    - **cacheFileUrl (string):**
      - URL of the cached file.
    - **cacheFile (File):**
      - File object of the cached file, enabling file read/write operations.
    - **firstInit (boolean):**
      - `true` when the plugin is being installed/loaded for the first time.
    - **ctx (PluginContext):**
      - Your plugin's native context. Provides encrypted secret storage (`getSecret`, `setSecret`, `deleteSecret`, `clearAllSecrets`) and permission checks (`grantedPermission`, `listAllPermissions`). See [Plugin Context (`ctx`)](./plugin-context.md).

### Example main.js File

The official templates structure the plugin as an `AcodePlugin` class. Here is an illustrative example of a `main.js` file:

```javascript
import plugin from "../plugin.json";

class AcodePlugin {
	baseUrl = "";

	async init($page, cacheFile, cacheFileUrl, firstInit, ctx) {
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

	acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile, firstInit, ctx }) => {
		acodePlugin.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
		await acodePlugin.init($page, cacheFile, cacheFileUrl, firstInit, ctx);
	});

	acode.setPluginUnmount(plugin.id, () => {
		acodePlugin.destroy();
	});
}
```

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

::: tip
For command registration APIs, see [Commands](../utilities/commands.md).
:::

:::tip
You will not need to write these `init`/`destroy` registration functions for your plugin because the templates ship with them. You only need to write your plugin code inside the `AcodePlugin` class.
:::
